package com.nutrifybe.controller;

import com.nutrifybe.entity.Nutricionista;
import com.nutrifybe.repository.NutricionistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/nutricionistas")
@CrossOrigin(origins = "*")
public class NutricionistaController {

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @GetMapping
    public List<Nutricionista> listarTodos() {
        return nutricionistaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Nutricionista> buscarPorId(@PathVariable Long id) {
        Optional<Nutricionista> nutricionista = nutricionistaRepository.findById(id);
        return nutricionista.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Nutricionista criar(@RequestBody Nutricionista nutricionista) {
        return nutricionistaRepository.save(nutricionista);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Nutricionista> atualizar(@PathVariable Long id, @RequestBody Nutricionista nutricionistaAtualizado) {
        Optional<Nutricionista> nutricionistaExistente = nutricionistaRepository.findById(id);
        
        if (nutricionistaExistente.isPresent()) {
            Nutricionista nutricionista = nutricionistaExistente.get();
            
            if (nutricionistaAtualizado.getNome() != null) {
                nutricionista.setNome(nutricionistaAtualizado.getNome());
            }
            if (nutricionistaAtualizado.getEmail() != null) {
                nutricionista.setEmail(nutricionistaAtualizado.getEmail());
            }
            if (nutricionistaAtualizado.getTelefone() != null) {
                nutricionista.setTelefone(nutricionistaAtualizado.getTelefone());
            }
            if (nutricionistaAtualizado.getEspecialidade() != null) {
                nutricionista.setEspecialidade(nutricionistaAtualizado.getEspecialidade());
            }
            if (nutricionistaAtualizado.getStatus() != null) {
                nutricionista.setStatus(nutricionistaAtualizado.getStatus());
            }
            if (nutricionistaAtualizado.getAtivo() != null) {
                nutricionista.setAtivo(nutricionistaAtualizado.getAtivo());
            }
            if (nutricionistaAtualizado.getFoto() != null) {
                nutricionista.setFoto(nutricionistaAtualizado.getFoto());
            }
            
            return ResponseEntity.ok(nutricionistaRepository.save(nutricionista));
        }
        
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (nutricionistaRepository.existsById(id)) {
            nutricionistaRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}