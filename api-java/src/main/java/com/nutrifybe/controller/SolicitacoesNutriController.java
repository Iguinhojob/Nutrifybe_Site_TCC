package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.model.SolicitacaoPendente;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/** A fila de solicitações fica restrita à conta autenticada do nutricionista. */
@RestController
@RequestMapping("/api/nutri/solicitacoes")
public class SolicitacoesNutriController {
    private final SolicitacaoPendenteRepository solicitacoes;
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;
    private final TokenService tokens;

    public SolicitacoesNutriController(SolicitacaoPendenteRepository solicitacoes, PacienteRepository pacientes,
                                       NutricionistaRepository nutricionistas, TokenService tokens) {
        this.solicitacoes = solicitacoes;
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
        this.tokens = tokens;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long nutriId = nutriAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        return ResponseEntity.ok(solicitacoes.findByNutricionistaIdOrderByIdDesc(nutriId));
    }

    @PutMapping("/{id}/aceitar")
    @Transactional
    public ResponseEntity<?> aceitar(@RequestHeader(value = "Authorization", required = false) String auth,
                                     @PathVariable Long id) {
        Long nutriId = nutriAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        SolicitacaoPendente pedido = solicitacoes.findByIdAndNutricionistaId(id, nutriId).orElse(null);
        if (pedido == null) return erro(404, "Solicitação não encontrada para esta conta");
        Paciente paciente = pacientes.findFirstByEmailIgnoreCase(pedido.getEmail()).orElse(null);
        if (paciente == null) {
            paciente = new Paciente();
            paciente.setNome(pedido.getNome());
            paciente.setEmail(pedido.getEmail());
            paciente.setIdade(pedido.getIdade());
            paciente.setPeso(pedido.getPeso());
            paciente.setAltura(pedido.getAltura());
            paciente.setObjetivo(pedido.getObjetivo());
            paciente.setCondicaoSaude(pedido.getCondicaoSaude());
            paciente.setAtivo(1);
            paciente.setDataCriacao(Instant.now().toString());
        }
        if (paciente.getNutricionistaId() != null && !nutriId.equals(paciente.getNutricionistaId())) {
            return erro(409, "O paciente já está vinculado a outro nutricionista");
        }
        paciente.setNutricionistaId(nutriId);
        paciente.setStatus("accepted");
        Paciente salvo = pacientes.save(paciente);
        solicitacoes.delete(pedido);
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", salvo.getId());
        resultado.put("nome", salvo.getNome());
        resultado.put("email", salvo.getEmail());
        resultado.put("status", salvo.getStatus());
        return ResponseEntity.ok(resultado);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> recusar(@RequestHeader(value = "Authorization", required = false) String auth,
                                     @PathVariable Long id) {
        Long nutriId = nutriAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        SolicitacaoPendente pedido = solicitacoes.findByIdAndNutricionistaId(id, nutriId).orElse(null);
        if (pedido == null) return erro(404, "Solicitação não encontrada para esta conta");
        pacientes.findFirstByEmailIgnoreCase(pedido.getEmail()).ifPresent(paciente -> {
            if (nutriId.equals(paciente.getNutricionistaId()) && "pending".equalsIgnoreCase(paciente.getStatus())) {
                paciente.setNutricionistaId(null);
                paciente.setStatus("solo");
                pacientes.save(paciente);
            }
        });
        solicitacoes.delete(pedido);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long nutriAtivo(String auth) {
        Long id = tokens.validarNutricionista(auth);
        if (id == null) return null;
        return nutricionistas.findById(id)
                .filter(n -> "approved".equalsIgnoreCase(n.getStatus()) && Integer.valueOf(1).equals(n.getAtivo()))
                .map(n -> n.getId()).orElse(null);
    }

    private ResponseEntity<?> erro(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", message));
    }
}
