package com.nutrifybe.controller;

import com.nutrifybe.entity.SolicitacaoPendente;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitacoes-pendentes")
@CrossOrigin(origins = "*")
public class SolicitacaoPendenteController {

    @Autowired
    private SolicitacaoPendenteRepository solicitacaoPendenteRepository;

    @GetMapping
    public List<SolicitacaoPendente> listarTodas() {
        return solicitacaoPendenteRepository.findAll();
    }

    @PostMapping
    public SolicitacaoPendente criar(@RequestBody SolicitacaoPendente solicitacao) {
        return solicitacaoPendenteRepository.save(solicitacao);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (solicitacaoPendenteRepository.existsById(id)) {
            solicitacaoPendenteRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}