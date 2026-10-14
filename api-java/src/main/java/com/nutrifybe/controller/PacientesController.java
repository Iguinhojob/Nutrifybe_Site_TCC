package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pacientes")
public class PacientesController {

    private final PacienteRepository repository;
    private final TokenService tokens;

    public PacientesController(PacienteRepository repository, TokenService tokens) {
        this.repository = repository;
        this.tokens = tokens;
    }

    /** Rotas de gestão de pacientes: uso exclusivo do painel administrativo. */
    private boolean admin(String auth) { return tokens.validarAdmin(auth) != null; }
    private static final ResponseEntity<?> NAO_AUTORIZADO = ResponseEntity.status(401)
            .body(Map.of("success", false, "message", "Sessão de administrador inválida ou expirada"));

    @GetMapping
    public ResponseEntity<?> getAll(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!admin(auth)) return NAO_AUTORIZADO;
        List<Map<String, Object>> lista = repository.findAll().stream().map(this::resumoPublico).collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        if (!admin(auth)) return NAO_AUTORIZADO;
        return repository.findById(id)
                .map(p -> ResponseEntity.ok((Object) resumoPublico(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Paciente paciente) {
        if (!admin(auth)) return NAO_AUTORIZADO;
        repository.save(paciente);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!admin(auth)) return NAO_AUTORIZADO;
        if (body.containsKey("prescricaoSemanal") || body.containsKey("calendario")
                || body.containsKey("nutricionistaId") || body.containsKey("status")) {
            return ResponseEntity.status(403).body(Map.of("success", false,
                    "message", "Dados do acompanhamento só podem ser alterados pelo fluxo autenticado do nutricionista"));
        }
        return repository.findById(id).map(paciente -> {
            if (body.containsKey("ativo")) paciente.setAtivo(((Number) body.get("ativo")).intValue());
            if (body.containsKey("prescricaoSemanal")) paciente.setPrescricaoSemanal((String) body.get("prescricaoSemanal"));
            if (body.containsKey("nutricionistaId")) paciente.setNutricionistaId(Long.valueOf(body.get("nutricionistaId").toString()));
            if (body.containsKey("calendario")) paciente.setCalendario(body.get("calendario").toString());
            repository.save(paciente);
            return ResponseEntity.ok((Object) Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        if (!admin(auth)) return NAO_AUTORIZADO;
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> resumoPublico(Paciente p) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("id", p.getId());
        dados.put("nome", p.getNome());
        dados.put("email", p.getEmail());
        dados.put("idade", p.getIdade());
        dados.put("dataNascimento", p.getDataNascimento());
        dados.put("sexo", p.getSexo());
        dados.put("peso", p.getPeso());
        dados.put("altura", p.getAltura());
        dados.put("pesoMeta", p.getPesoMeta());
        dados.put("metaAgua", p.getMetaAgua());
        dados.put("objetivo", p.getObjetivo());
        dados.put("atividade", p.getAtividade());
        dados.put("restricoes", p.getRestricoes());
        dados.put("observacoes", p.getObservacoes());
        dados.put("nutricionistaId", p.getNutricionistaId());
        dados.put("status", p.getStatus());
        dados.put("ativo", p.getAtivo());
        dados.put("dataCriacao", p.getDataCriacao());
        return dados;
    }
}
