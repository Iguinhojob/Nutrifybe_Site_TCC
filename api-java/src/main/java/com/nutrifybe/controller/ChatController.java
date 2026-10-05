package com.nutrifybe.controller;

import com.nutrifybe.model.ChatMensagem;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.ChatMensagemRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private static final long MAX_FILE_BYTES = 8L * 1024 * 1024;
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp",
            "application/pdf", "pdf", "text/plain", "txt"
    );

    private final ChatMensagemRepository mensagens;
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;
    private final TokenService tokens;

    public ChatController(ChatMensagemRepository mensagens, PacienteRepository pacientes,
                          NutricionistaRepository nutricionistas, TokenService tokens) {
        this.mensagens = mensagens;
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
        this.tokens = tokens;
    }

    @GetMapping("/mensagens")
    @Transactional
    public ResponseEntity<?> listar(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestParam(required = false) Long pacienteId) {
        Acesso acesso = resolver(auth, pacienteId);
        if (acesso == null) return erro(403, "Chat disponível apenas para paciente e nutricionista com vínculo ativo.");
        List<ChatMensagem> lista = mensagens.findTop100ByPacienteIdAndNutricionistaIdOrderByIdDesc(acesso.pacienteId, acesso.nutricionistaId);
        LocalDateTime agora = LocalDateTime.now();
        lista.stream().filter(m -> !acesso.tipo.equals(m.getRemetenteTipo()) && m.getLidoEm() == null)
                .forEach(m -> m.setLidoEm(agora));
        return ResponseEntity.ok(lista.stream().sorted(Comparator.comparing(ChatMensagem::getId)).map(this::dto).toList());
    }

    @PostMapping(value = "/mensagens", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> enviar(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestParam(required = false) Long pacienteId,
                                    @RequestParam(required = false) String texto,
                                    @RequestPart(required = false) MultipartFile arquivo) {
        Acesso acesso = resolver(auth, pacienteId);
        if (acesso == null) return erro(403, "Chat disponível apenas para paciente e nutricionista com vínculo ativo.");
        String mensagem = texto == null ? "" : texto.trim();
        if (mensagem.length() > 4000) return erro(400, "A mensagem deve ter no máximo 4.000 caracteres.");
        if (mensagem.isEmpty() && (arquivo == null || arquivo.isEmpty())) return erro(400, "Escreva uma mensagem ou anexe um arquivo.");
        if (arquivo != null && !arquivo.isEmpty()) {
            String type = arquivo.getContentType() == null ? "" : arquivo.getContentType().toLowerCase(Locale.ROOT);
            if (arquivo.getSize() > MAX_FILE_BYTES) return erro(413, "O anexo deve ter no máximo 8 MB.");
            if (!ALLOWED_TYPES.containsKey(type)) return erro(415, "Formato não permitido. Envie JPG, PNG, WEBP, PDF ou TXT.");
            String original = Optional.ofNullable(arquivo.getOriginalFilename()).orElse("anexo");
            String name = original.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_").trim();
            if (name.isBlank()) name = "anexo." + ALLOWED_TYPES.get(type);
            if (name.length() > 255) name = name.substring(name.length() - 255);
            try {
                ChatMensagem nova = base(acesso, mensagem);
                nova.setArquivoNome(name);
                nova.setArquivoTipo(type);
                nova.setArquivoTamanho(arquivo.getSize());
                nova.setArquivoDados(arquivo.getBytes());
                return ResponseEntity.ok(dto(mensagens.save(nova)));
            } catch (Exception e) { return erro(400, "Não foi possível ler o anexo."); }
        }
        return ResponseEntity.ok(dto(mensagens.save(base(acesso, mensagem))));
    }

    @GetMapping("/mensagens/{id}/arquivo")
    @Transactional(readOnly = true)
    public ResponseEntity<?> baixar(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestParam(required = false) Long pacienteId, @PathVariable Long id) {
        Acesso acesso = resolver(auth, pacienteId);
        if (acesso == null) return erro(403, "Acesso ao anexo não autorizado.");
        ChatMensagem m = mensagens.findByIdAndPacienteIdAndNutricionistaId(id, acesso.pacienteId, acesso.nutricionistaId).orElse(null);
        if (m == null || m.getArquivoDados() == null) return erro(404, "Anexo não encontrado.");
        String encoded = URLEncoder.encode(m.getArquivoNome(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(m.getArquivoTipo()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .header("X-Content-Type-Options", "nosniff")
                .body(new ByteArrayResource(m.getArquivoDados()));
    }

    private ChatMensagem base(Acesso a, String texto) {
        ChatMensagem m = new ChatMensagem();
        m.setPacienteId(a.pacienteId); m.setNutricionistaId(a.nutricionistaId);
        m.setRemetenteTipo(a.tipo); m.setRemetenteId(a.remetenteId); m.setRemetenteNome(a.nome);
        m.setTexto(texto.isBlank() ? null : texto); m.setCriadoEm(LocalDateTime.now());
        return m;
    }

    private Acesso resolver(String auth, Long requestedPatientId) {
        Long patientToken = tokens.validar(auth);
        if (patientToken != null) {
            if (requestedPatientId != null && !requestedPatientId.equals(patientToken)) return null;
            Paciente p = pacientes.findById(patientToken).orElse(null);
            if (p == null || p.getNutricionistaId() == null || !"accepted".equalsIgnoreCase(p.getStatus())) return null;
            Nutricionista n = nutricionistas.findById(p.getNutricionistaId()).orElse(null);
            if (!nutriAtivo(n)) return null;
            return new Acesso(p.getId(), n.getId(), "paciente", p.getId(), p.getNome());
        }
        Long nutriToken = tokens.validarNutricionista(auth);
        if (nutriToken == null || requestedPatientId == null) return null;
        Nutricionista n = nutricionistas.findById(nutriToken).orElse(null);
        Paciente p = pacientes.findById(requestedPatientId).orElse(null);
        if (!nutriAtivo(n) || p == null || !nutriToken.equals(p.getNutricionistaId()) || !"accepted".equalsIgnoreCase(p.getStatus())) return null;
        return new Acesso(p.getId(), n.getId(), "nutricionista", n.getId(), n.getNome());
    }

    private boolean nutriAtivo(Nutricionista n) {
        return n != null && "approved".equalsIgnoreCase(n.getStatus()) && Integer.valueOf(1).equals(n.getAtivo());
    }

    private Map<String, Object> dto(ChatMensagem m) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId()); out.put("pacienteId", m.getPacienteId());
        out.put("remetenteTipo", m.getRemetenteTipo()); out.put("remetenteId", m.getRemetenteId());
        out.put("remetenteNome", m.getRemetenteNome()); out.put("texto", m.getTexto());
        out.put("criadoEm", m.getCriadoEm()); out.put("lidoEm", m.getLidoEm());
        out.put("arquivoNome", m.getArquivoNome()); out.put("arquivoTipo", m.getArquivoTipo()); out.put("arquivoTamanho", m.getArquivoTamanho());
        return out;
    }

    private ResponseEntity<Map<String, Object>> erro(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", message));
    }

    private record Acesso(Long pacienteId, Long nutricionistaId, String tipo, Long remetenteId, String nome) {}
}
