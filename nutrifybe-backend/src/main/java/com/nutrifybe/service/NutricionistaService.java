package com.nutrifybe.service;

import com.nutrifybe.entity.Nutricionista;
import com.nutrifybe.repository.NutricionistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class NutricionistaService {
    
    @Autowired
    private NutricionistaRepository repository;
    
    public List<Nutricionista> findAll() {
        return repository.findAll();
    }
    
    public Optional<Nutricionista> findById(Long id) {
        return repository.findById(id);
    }
    
    public Nutricionista save(Nutricionista nutricionista) {
        return repository.save(nutricionista);
    }
    
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
    
    public Optional<Nutricionista> findByEmailAndCrnAndSenha(String email, String crn, String senha) {
        return repository.findByEmailAndCrnAndSenha(email, crn, senha);
    }
}