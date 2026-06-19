package com.nutrifybe.controller;

import com.nutrifybe.model.SolicitacaoPendente;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/solicitacoesPendentes")
public class SolicitacoesController {

    private final SolicitacaoPendenteRepository repository;

    public SolicitacoesController(SolicitacaoPendenteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SolicitacaoPendente> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody SolicitacaoPendente solicitacao) {
        repository.save(solicitacao);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
