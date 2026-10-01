package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.PacienteRepository;
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

    public PacientesController(PacienteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return repository.findAll().stream().map(this::resumoPublico).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(p -> ResponseEntity.ok((Object) resumoPublico(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Paciente paciente) {
        repository.save(paciente);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (body.containsKey("prescricaoSemanal") || body.containsKey("calendario")
                || body.containsKey("nutricionistaId") || body.containsKey("status")) {
            return ResponseEntity.status(403).body(Map.of("success", false,
                    "message", "Dados do acompanhamento só podem ser alterados pelo fluxo autenticado do nutricionista"));
        }
        return repository.findById(id).map(paciente -> {
            if (body.containsKey("ativo")) paciente.setAtivo((Integer) body.get("ativo"));
            if (body.containsKey("prescricaoSemanal")) paciente.setPrescricaoSemanal((String) body.get("prescricaoSemanal"));
            if (body.containsKey("nutricionistaId")) paciente.setNutricionistaId(Long.valueOf(body.get("nutricionistaId").toString()));
            if (body.containsKey("calendario")) paciente.setCalendario(body.get("calendario").toString());
            repository.save(paciente);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
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
