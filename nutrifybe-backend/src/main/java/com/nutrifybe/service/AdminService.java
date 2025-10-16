package com.nutrifybe.service;

import com.nutrifybe.entity.Admin;
import com.nutrifybe.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository repository;
    
    public Optional<Admin> findByEmailAndSenha(String email, String senha) {
        return repository.findByEmailAndSenha(email, senha);
    }
}