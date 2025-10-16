package com.nutrifybe.controller;

import com.nutrifybe.entity.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pacientes")
@CrossOrigin(origins = "*")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @GetMapping
    public List<Paciente> listarTodos() {
        return pacienteRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Paciente> buscarPorId(@PathVariable Long id) {
        Optional<Paciente> paciente = pacienteRepository.findById(id);
        return paciente.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Paciente criar(@RequestBody Paciente paciente) {
        return pacienteRepository.save(paciente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paciente> atualizar(@PathVariable Long id, @RequestBody Paciente pacienteAtualizado) {
        Optional<Paciente> pacienteExistente = pacienteRepository.findById(id);
        
        if (pacienteExistente.isPresent()) {
            Paciente paciente = pacienteExistente.get();
            
            if (pacienteAtualizado.getNome() != null) {
                paciente.setNome(pacienteAtualizado.getNome());
            }
            if (pacienteAtualizado.getEmail() != null) {
                paciente.setEmail(pacienteAtualizado.getEmail());
            }
            if (pacienteAtualizado.getIdade() != null) {
                paciente.setIdade(pacienteAtualizado.getIdade());
            }
            if (pacienteAtualizado.getPeso() != null) {
                paciente.setPeso(pacienteAtualizado.getPeso());
            }
            if (pacienteAtualizado.getAltura() != null) {
                paciente.setAltura(pacienteAtualizado.getAltura());
            }
            if (pacienteAtualizado.getObjetivo() != null) {
                paciente.setObjetivo(pacienteAtualizado.getObjetivo());
            }
            if (pacienteAtualizado.getCondicaoSaude() != null) {
                paciente.setCondicaoSaude(pacienteAtualizado.getCondicaoSaude());
            }
            if (pacienteAtualizado.getStatus() != null) {
                paciente.setStatus(pacienteAtualizado.getStatus());
            }
            if (pacienteAtualizado.getAtivo() != null) {
                paciente.setAtivo(pacienteAtualizado.getAtivo());
            }
            if (pacienteAtualizado.getPrescricaoSemanal() != null) {
                paciente.setPrescricaoSemanal(pacienteAtualizado.getPrescricaoSemanal());
            }
            
            paciente.setDataUltimaAtualizacao(LocalDateTime.now());
            return ResponseEntity.ok(pacienteRepository.save(paciente));
        }
        
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (pacienteRepository.existsById(id)) {
            pacienteRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}