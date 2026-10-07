package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.SolicitacaoPendente;
import com.nutrifybe.model.AvaliacaoNutricionista;
import com.nutrifybe.model.DenunciaNutricionista;
import com.nutrifybe.repository.AvaliacaoNutricionistaRepository;
import com.nutrifybe.repository.DenunciaNutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Cadastro, login e perfil do paciente (usado pelo app mobile). */
@RestController
@RequestMapping({"/api/auth/paciente", "/api/auth"})
public class AuthPacienteController {

    private final PacienteRepository repository;
    private final NutricionistaRepository nutricionistaRepository;
    private final SolicitacaoPendenteRepository solicitacaoRepository;
    private final AvaliacaoNutricionistaRepository avaliacaoRepository;
    private final DenunciaNutricionistaRepository denunciaRepository;
    private final TokenService tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthPacienteController(PacienteRepository repository,
                                  NutricionistaRepository nutricionistaRepository,
                                  SolicitacaoPendenteRepository solicitacaoRepository,
                                  AvaliacaoNutricionistaRepository avaliacaoRepository,
                                  DenunciaNutricionistaRepository denunciaRepository,
                                  TokenService tokens) {
        this.repository = repository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.denunciaRepository = denunciaRepository;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        String nome = primeiroTexto(body, "nome", "name");
        String email = Campos.texto(body.get("email"));
        String senha = primeiroTexto(body, "senha", "password");

        if (nome == null || email == null || !email.contains("@")) {
            return erro(400, "Informe nome e e-mail válidos");
        }
        if (senha == null || senha.length() < 6) {
            return erro(400, "A senha precisa ter pelo menos 6 caracteres");
        }
        String emailFinal = email.toLowerCase();
        if (repository.existsByEmailIgnoreCase(emailFinal)) {
            return erro(409, "E-mail já cadastrado");
        }

        Nutricionista nutricionista = null;
        Object nutricionistaIdValue = body.get("nutricionistaId");
        if (nutricionistaIdValue != null) {
            Long nutricionistaId;
            try {
                nutricionistaId = Long.valueOf(nutricionistaIdValue.toString());
            } catch (NumberFormatException e) {
                return erro(400, "Nutricionista invalido");
            }
            Optional<Nutricionista> encontrado = nutricionistaRepository.findById(nutricionistaId);
            if (encontrado.isEmpty() || !"approved".equalsIgnoreCase(encontrado.get().getStatus())
                    || !Integer.valueOf(1).equals(encontrado.get().getAtivo())) {
                return erro(400, "Nutricionista nao encontrado ou indisponivel");
            }
            nutricionista = encontrado.get();
        }

        Paciente p = new Paciente();
        p.setNome(nome);
        p.setEmail(emailFinal);
        p.setSenha(encoder.encode(senha));
        p.setIdade(body.containsKey("idade") ? Campos.inteiro(body.get("idade")) : idadeDe(body.get("birthDate")));
        p.setDataNascimento(primeiroTexto(body, "dataNascimento", "birthDate"));
        p.setSexo(Campos.texto(body.get("sexo")));
        p.setPeso(body.containsKey("peso") ? Campos.decimal(body.get("peso")) : Campos.decimal(body.get("weight")));
        p.setAltura(body.containsKey("altura") ? Campos.decimal(body.get("altura")) : Campos.decimal(body.get("height")));
        p.setPesoMeta(body.containsKey("pesoMeta") ? Campos.decimal(body.get("pesoMeta")) : Campos.decimal(body.get("targetWeight")));
        p.setMetaAgua(body.containsKey("metaAgua") ? Campos.decimal(body.get("metaAgua")) : Campos.decimal(body.get("waterGoal")));
        p.setObjetivo(primeiroTexto(body, "objetivo", "goal"));
        p.setAtividade(primeiroTexto(body, "atividade", "activityLevel"));
        p.setMotivacao(primeiroTexto(body, "motivacao", "motivation"));
        p.setRestricoes(primeiroTexto(body, "restricoes", "restrictions"));
        p.setObservacoes(primeiroTexto(body, "observacoes", "healthNote"));
        p.setOrigem(primeiroTexto(body, "origem", "origin"));
        p.setPreferenciaAcompanhamento(primeiroTexto(body, "preferenciaAcompanhamento", "followupPreference"));
        p.setCondicaoSaude(primeiroTexto(body, "condicaoSaude", "healthNote", "restrictions"));
        p.setNutricionistaId(nutricionista == null ? null : nutricionista.getId());
        p.setStatus(nutricionista == null ? "solo" : "pending");
        p.setAtivo(1);
        p.setDataCriacao(Instant.now().toString());
        repository.save(p);
        if (nutricionista != null) {
            criarSolicitacao(p);
        }
        return ResponseEntity.ok(resposta(p));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email = Campos.texto(body.get("email"));
        String senha = primeiroTexto(body, "senha", "password");
        if (email == null || senha == null) {
            return erro(400, "Informe e-mail e senha");
        }

        Optional<Paciente> op = repository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(email);
        if (op.isEmpty() || !encoder.matches(senha, op.get().getSenha())) {
            return erro(401, "E-mail ou senha inválidos");
        }
        Paciente p = op.get();
        if (p.getAtivo() != null && p.getAtivo() == 0) {
            return erro(403, "Conta inativa");
        }
        return ResponseEntity.ok(resposta(p));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");
        return ResponseEntity.ok(op.get());
    }

    @PutMapping("/me")
    public ResponseEntity<?> atualizar(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");

        Paciente p = op.get();
        String nome = primeiroTexto(body, "nome", "name");
        if (nome != null) p.setNome(nome);
        if (body.containsKey("idade")) p.setIdade(Campos.inteiro(body.get("idade")));
        if (containsAny(body, "peso", "weight")) p.setPeso(Campos.decimal(primeiroValor(body, "peso", "weight")));
        if (containsAny(body, "altura", "height")) p.setAltura(Campos.decimal(primeiroValor(body, "altura", "height")));
        if (containsAny(body, "objetivo", "goal")) p.setObjetivo(primeiroTexto(body, "objetivo", "goal"));
        if (containsAny(body, "condicaoSaude", "healthNote")) {
            String healthNote = primeiroTexto(body, "condicaoSaude", "healthNote");
            p.setCondicaoSaude(healthNote);
            p.setObservacoes(healthNote);
        }
        if (body.containsKey("nutricionistaId")) return erro(400, "Use o endpoint de vinculo para solicitar um nutricionista");
        if (containsAny(body, "dataNascimento", "birthDate")) p.setDataNascimento(primeiroTexto(body, "dataNascimento", "birthDate"));
        if (body.containsKey("sexo")) p.setSexo(Campos.texto(body.get("sexo")));
        if (containsAny(body, "pesoMeta", "targetWeight")) p.setPesoMeta(Campos.decimal(primeiroValor(body, "pesoMeta", "targetWeight")));
        if (containsAny(body, "metaAgua", "waterGoal")) p.setMetaAgua(Campos.decimal(primeiroValor(body, "metaAgua", "waterGoal")));
        if (containsAny(body, "atividade", "activityLevel")) p.setAtividade(primeiroTexto(body, "atividade", "activityLevel"));
        if (containsAny(body, "motivacao", "motivation")) p.setMotivacao(primeiroTexto(body, "motivacao", "motivation"));
        if (containsAny(body, "restricoes", "restrictions")) p.setRestricoes(primeiroTexto(body, "restricoes", "restrictions"));
        if (body.containsKey("observacoes")) p.setObservacoes(Campos.texto(body.get("observacoes")));
        if (containsAny(body, "origem", "origin")) p.setOrigem(primeiroTexto(body, "origem", "origin"));
        if (containsAny(body, "preferenciaAcompanhamento", "followupPreference")) p.setPreferenciaAcompanhamento(primeiroTexto(body, "preferenciaAcompanhamento", "followupPreference"));
        repository.save(p);
        return ResponseEntity.ok(p);
    }

    @PostMapping("/me/vinculo")
    @Transactional
    public ResponseEntity<?> solicitarVinculo(@RequestHeader(value = "Authorization", required = false) String auth,
                                               @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessao invalida");
        Long nutricionistaId;
        try {
            nutricionistaId = Long.valueOf(body.get("nutricionistaId").toString());
        } catch (Exception e) {
            return erro(400, "Nutricionista invalido");
        }
        Optional<Nutricionista> nutricionista = nutricionistaRepository.findById(nutricionistaId);
        if (nutricionista.isEmpty() || !"approved".equalsIgnoreCase(nutricionista.get().getStatus())
                || !Integer.valueOf(1).equals(nutricionista.get().getAtivo())) {
            return erro(400, "Nutricionista nao encontrado ou indisponivel");
        }
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente nao encontrado");

        Paciente paciente = op.get();
        if (paciente.getNutricionistaId() != null && !nutricionistaId.equals(paciente.getNutricionistaId())) {
            return erro(409, "Encerre o vínculo atual antes de solicitar outro nutricionista");
        }
        if (!nutricionistaId.equals(paciente.getNutricionistaId())) {
            paciente.setNutricionistaId(nutricionistaId);
            paciente.setStatus("pending");
            repository.save(paciente);
        }
        criarSolicitacao(paciente);
        return ResponseEntity.ok(paciente);
    }

    /** O paciente encerra seu próprio acompanhamento após registrar a avaliação do profissional. */
    @PostMapping("/me/vinculo/encerrar")
    @Transactional
    public ResponseEntity<?> encerrarVinculo(@RequestHeader(value = "Authorization", required = false) String auth,
                                              @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Paciente paciente = repository.findById(id).orElse(null);
        if (paciente == null) return erro(404, "Paciente não encontrado");
        if (paciente.getNutricionistaId() == null || !"accepted".equalsIgnoreCase(paciente.getStatus())) {
            return erro(400, "Você não possui um vínculo ativo para encerrar");
        }
        Integer nota = Campos.inteiro(body.get("nota"));
        if (nota == null || nota < 1 || nota > 5) return erro(400, "Informe uma avaliação de 1 a 5 estrelas");
        String comentario = Campos.texto(body.get("comentario"));
        if (comentario != null && comentario.length() > 1200) return erro(400, "O comentário deve ter no máximo 1.200 caracteres");
        String denuncia = Campos.texto(body.get("denuncia"));
        if (denuncia != null && denuncia.length() > 2000) return erro(400, "A denúncia deve ter no máximo 2.000 caracteres");

        AvaliacaoNutricionista avaliacao = new AvaliacaoNutricionista();
        avaliacao.setPacienteId(paciente.getId());
        avaliacao.setNutricionistaId(paciente.getNutricionistaId());
        avaliacao.setNota(nota);
        avaliacao.setComentario(comentario);
        avaliacao.setCriadoEm(LocalDateTime.now());
        avaliacaoRepository.save(avaliacao);

        if (denuncia != null) {
            DenunciaNutricionista registro = new DenunciaNutricionista();
            registro.setPacienteId(paciente.getId());
            registro.setNutricionistaId(paciente.getNutricionistaId());
            registro.setDescricao(denuncia);
            registro.setCriadoEm(LocalDateTime.now());
            denunciaRepository.save(registro);
        }

        paciente.setNutricionistaId(null);
        paciente.setStatus("solo");
        repository.save(paciente);
        return ResponseEntity.ok(Map.of("success", true, "paciente", paciente));
    }

    private Map<String, Object> resposta(Paciente p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("token", tokens.gerar(p.getId()));
        m.put("paciente", p);
        return m;
    }

    private ResponseEntity<?> erro(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", mensagem));
    }

    private void criarSolicitacao(Paciente paciente) {
        Long nutricionistaId = paciente.getNutricionistaId();
        if (nutricionistaId == null || solicitacaoRepository.existsByEmailIgnoreCaseAndNutricionistaId(paciente.getEmail(), nutricionistaId)) return;
        SolicitacaoPendente solicitacao = new SolicitacaoPendente();
        solicitacao.setNome(paciente.getNome());
        solicitacao.setEmail(paciente.getEmail());
        solicitacao.setIdade(paciente.getIdade());
        solicitacao.setPeso(paciente.getPeso());
        solicitacao.setAltura(paciente.getAltura());
        solicitacao.setObjetivo(paciente.getObjetivo());
        solicitacao.setCondicaoSaude(paciente.getCondicaoSaude());
        solicitacao.setNutricionistaId(nutricionistaId);
        solicitacaoRepository.save(solicitacao);
    }

    private static String primeiroTexto(Map<String, Object> body, String... nomes) {
        for (String nome : nomes) {
            String valor = Campos.texto(body.get(nome));
            if (valor != null) return valor;
        }
        return null;
    }

    private static Object primeiroValor(Map<String, Object> body, String... nomes) {
        for (String nome : nomes) {
            if (body.containsKey(nome)) return body.get(nome);
        }
        return null;
    }

    private static boolean containsAny(Map<String, Object> body, String... nomes) {
        for (String nome : nomes) if (body.containsKey(nome)) return true;
        return false;
    }

    private static Integer idadeDe(Object valor) {
        String texto = Campos.texto(valor);
        if (texto == null) return null;
        for (DateTimeFormatter formato : new DateTimeFormatter[]{DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("dd/MM/yyyy")}) {
            try { return Period.between(LocalDate.parse(texto, formato), LocalDate.now()).getYears(); }
            catch (DateTimeParseException ignored) { }
        }
        return null;
    }
}
