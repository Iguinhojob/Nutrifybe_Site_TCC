package com.nutrifybe.controller;

import com.nutrifybe.model.SolicitacaoPendente;
import com.nutrifybe.model.Paciente;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/solicitacoesPendentes")
public class SolicitacoesController {

    private final SolicitacaoPendenteRepository repository;
    private final PacienteRepository pacienteRepository;
    private final NutricionistaRepository nutricionistaRepository;
    private final TokenService tokens;

    public SolicitacoesController(SolicitacaoPendenteRepository repository,
                                  PacienteRepository pacienteRepository,
                                  NutricionistaRepository nutricionistaRepository,
                                  TokenService tokens) {
        this.repository = repository;
        this.pacienteRepository = pacienteRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.tokens = tokens;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return repository.findAll().stream().map(pedido -> Map.<String, Object>of("id", pedido.getId())).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody SolicitacaoPendente solicitacao) {
        repository.save(solicitacao);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id) {
        Long nutricionistaId = tokens.validarNutricionista(auth);
        if (nutricionistaId == null) return ResponseEntity.status(401).body(Map.of("message", "Sessão inválida"));
        Optional<SolicitacaoPendente> request = repository.findById(id);
        if (request.isEmpty()) return ResponseEntity.notFound().build();
        SolicitacaoPendente pending = request.get();
        if (!nutricionistaId.equals(pending.getNutricionistaId())) return ResponseEntity.status(403).body(Map.of("message", "Solicitação de outra conta"));
        pacienteRepository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(pending.getEmail()).ifPresent(patient -> {
            if (pending.getNutricionistaId() != null && pending.getNutricionistaId().equals(patient.getNutricionistaId())) {
                patient.setNutricionistaId(null);
                patient.setStatus("solo");
                pacienteRepository.save(patient);
            }
        });
        repository.delete(pending);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/accept")
    @Transactional
    public ResponseEntity<?> accept(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tokenNutricionistaId = tokens.validarNutricionista(auth);
        if (tokenNutricionistaId == null) return ResponseEntity.status(401).body(Map.of("message", "Sessão inválida"));
        Optional<SolicitacaoPendente> request = repository.findById(id);
        if (request.isEmpty()) return ResponseEntity.notFound().build();

        Long nutritionistId = tokenNutricionistaId;
        SolicitacaoPendente pending = request.get();
        if (!nutritionistId.equals(pending.getNutricionistaId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Solicitacao pertence a outro nutricionista"));
        }
        Optional<Nutricionista> nutritionist = nutricionistaRepository.findById(nutritionistId);
        if (nutritionist.isEmpty() || !"approved".equalsIgnoreCase(nutritionist.get().getStatus())
                || !Integer.valueOf(1).equals(nutritionist.get().getAtivo())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nutricionista indisponivel"));
        }

        Paciente patient = pacienteRepository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(pending.getEmail())
                .orElseGet(() -> pacienteRepository.findFirstByEmailIgnoreCase(pending.getEmail()).orElse(null));
        if (patient == null) {
            patient = new Paciente();
            patient.setNome(pending.getNome());
            patient.setEmail(pending.getEmail());
            patient.setIdade(pending.getIdade());
            patient.setPeso(pending.getPeso());
            patient.setAltura(pending.getAltura());
            patient.setObjetivo(pending.getObjetivo());
            patient.setCondicaoSaude(pending.getCondicaoSaude());
            patient.setAtivo(1);
            patient.setDataCriacao(Instant.now().toString());
        }
        patient.setNutricionistaId(nutritionistId);
        patient.setStatus("accepted");
        Paciente saved = pacienteRepository.save(patient);
        repository.delete(pending);
        return ResponseEntity.ok(saved);
    }
}
