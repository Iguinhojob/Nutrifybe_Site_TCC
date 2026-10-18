package com.nutrifybe.controller;

import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.AvaliacaoNutricionista;
import com.nutrifybe.repository.AvaliacaoNutricionistaRepository;
import com.nutrifybe.repository.ChatMensagemRepository;
import com.nutrifybe.repository.DenunciaNutricionistaRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/nutricionistas")
public class NutricionistasController {

    private final NutricionistaRepository repository;
    private final AvaliacaoNutricionistaRepository avaliacaoRepository;
    private final TokenService tokens;
    private final PacienteRepository pacienteRepository;
    private final ChatMensagemRepository chatMensagemRepository;
    private final DenunciaNutricionistaRepository denunciaRepository;
    private final SolicitacaoPendenteRepository solicitacaoRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public NutricionistasController(NutricionistaRepository repository, AvaliacaoNutricionistaRepository avaliacaoRepository,
                                    TokenService tokens, PacienteRepository pacienteRepository,
                                    ChatMensagemRepository chatMensagemRepository,
                                    DenunciaNutricionistaRepository denunciaRepository,
                                    SolicitacaoPendenteRepository solicitacaoRepository) {
        this.repository = repository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.tokens = tokens;
        this.pacienteRepository = pacienteRepository;
        this.chatMensagemRepository = chatMensagemRepository;
        this.denunciaRepository = denunciaRepository;
        this.solicitacaoRepository = solicitacaoRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return repository.findAll().stream().map(this::publico).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(n -> ResponseEntity.ok((Object) publico(n)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/avaliacoes")
    public ResponseEntity<?> getAvaliacoes(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        List<AvaliacaoNutricionista> avaliacoes = avaliacaoRepository.findTop100ByNutricionistaIdOrderByCriadoEmDesc(id);
        List<Map<String, Object>> publicas = avaliacoes.stream().map(avaliacao -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nota", avaliacao.getNota());
            item.put("comentario", avaliacao.getComentario());
            item.put("criadoEm", avaliacao.getCriadoEm());
            return item;
        }).toList();
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("media", avaliacaoRepository.averageNota(id));
        resultado.put("total", avaliacaoRepository.countByNutricionistaId(id));
        resultado.put("avaliacoes", publicas);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestBody Nutricionista nutricionista) {
        if (nutricionista.getSenha() == null || nutricionista.getSenha().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "A senha deve ter pelo menos 6 caracteres"));
        }
        // Cadastro público sempre entra como pendente; só um administrador pode criar já aprovado.
        if (tokens.validarAdmin(auth) == null) {
            nutricionista.setStatus("pending");
            nutricionista.setAtivo(1);
        }
        nutricionista.setSenha(passwordEncoder.encode(nutricionista.getSenha()));
        repository.save(nutricionista);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String crn = body.get("crn");
        String senha = body.get("senha");

        Optional<Nutricionista> nutri = repository.findByEmailAndCrnAndStatusAndAtivo(email, crn, "approved", 1);

        if (nutri.isPresent() && passwordEncoder.matches(senha, nutri.get().getSenha())) {
            Nutricionista profissional = nutri.get();
            return ResponseEntity.ok(Map.of("success", true, "nutricionista", publico(profissional),
                    "token", tokens.gerarNutricionista(profissional.getId())));
        }
        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Credenciais inválidas"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id, @RequestBody Map<String, Object> body) {
        // Administrador altera qualquer conta; o nutricionista altera apenas o próprio perfil.
        boolean admin = tokens.validarAdmin(auth) != null;
        boolean proprio = id.equals(tokens.validarNutricionista(auth));
        if (!admin && !proprio) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sessão inválida ou sem permissão para alterar esta conta"));
        }
        if (!admin && (body.containsKey("status") || body.containsKey("ativo"))) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Somente o administrador pode aprovar ou desativar contas"));
        }
        return repository.findById(id).map(nutri -> {
            if (body.containsKey("email") && !String.valueOf(body.get("email")).equalsIgnoreCase(nutri.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Use a verificacao por e-mail para alterar o endereco da conta"));
            }
            if (body.containsKey("senha")) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Use a verificacao por e-mail para alterar a senha"));
            }
            if (body.containsKey("status")) nutri.setStatus((String) body.get("status"));
            if (body.containsKey("ativo")) nutri.setAtivo(((Number) body.get("ativo")).intValue());
            if (body.containsKey("nome")) nutri.setNome((String) body.get("nome"));
            if (body.containsKey("telefone")) nutri.setTelefone((String) body.get("telefone"));
            if (body.containsKey("especialidade")) nutri.setEspecialidade((String) body.get("especialidade"));
            if (body.containsKey("descricao")) nutri.setDescricao((String) body.get("descricao"));
            if (body.containsKey("experienceYears")) {
                Object anos = body.get("experienceYears");
                try {
                    Integer valor = anos == null || anos.toString().isBlank() ? null : Integer.valueOf(anos.toString());
                    if (valor != null && (valor < 0 || valor > 80)) throw new NumberFormatException();
                    nutri.setExperienceYears(valor);
                } catch (NumberFormatException e) { return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Informe entre 0 e 80 anos de experiência")); }
            }
            if (body.containsKey("focusAreas")) nutri.setFocusAreas((String) body.get("focusAreas"));
            if (body.containsKey("consultationModes")) nutri.setConsultationModes((String) body.get("consultationModes"));
            if (body.containsKey("foto")) nutri.setFoto((String) body.get("foto"));
            repository.save(nutri);
            return ResponseEntity.ok((Object) publico(nutri));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        if (tokens.validarAdmin(auth) == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Somente o administrador pode excluir contas"));
        }
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        // Mantém o cadastro e o histórico dos pacientes, apenas encerra o vínculo.
        var pacientesVinculados = pacienteRepository.findByNutricionistaId(id);
        pacientesVinculados.forEach(paciente -> paciente.setNutricionistaId(null));
        pacienteRepository.saveAll(pacientesVinculados);
        chatMensagemRepository.deleteByNutricionistaId(id);
        avaliacaoRepository.deleteByNutricionistaId(id);
        denunciaRepository.deleteByNutricionistaId(id);
        solicitacaoRepository.deleteByNutricionistaId(id);
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> publico(Nutricionista n) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("id", n.getId());
        dados.put("nome", n.getNome());
        dados.put("email", n.getEmail());
        dados.put("crn", n.getCrn());
        dados.put("status", n.getStatus());
        dados.put("ativo", n.getAtivo());
        dados.put("telefone", n.getTelefone());
        dados.put("especialidade", n.getEspecialidade());
        dados.put("descricao", n.getDescricao());
        dados.put("experienceYears", n.getExperienceYears());
        dados.put("focusAreas", listaPerfil(n.getFocusAreas()));
        dados.put("consultationModes", listaPerfil(n.getConsultationModes()));
        dados.put("foto", n.getFoto());
        dados.put("dataCriacao", n.getDataCriacao());
        return dados;
    }
    private java.util.List<String> listaPerfil(String texto) {
        if (texto == null || texto.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(texto.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
