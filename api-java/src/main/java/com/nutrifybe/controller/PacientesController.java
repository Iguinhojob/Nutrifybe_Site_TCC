package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pacientes")
public class PacientesController {

    private final PacienteRepository repository;

    public PacientesController(PacienteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Paciente> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Paciente paciente) {
        repository.save(paciente);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
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
}
