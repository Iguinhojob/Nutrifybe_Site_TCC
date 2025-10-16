package com.nutrifybe.service;

import com.nutrifybe.entity.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class PacienteService {
    
    @Autowired
    private PacienteRepository repository;
    
    public List<Paciente> findAll() {
        return repository.findAll();
    }
    
    public Optional<Paciente> findById(Long id) {
        return repository.findById(id);
    }
    
    public Paciente save(Paciente paciente) {
        return repository.save(paciente);
    }
    
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}