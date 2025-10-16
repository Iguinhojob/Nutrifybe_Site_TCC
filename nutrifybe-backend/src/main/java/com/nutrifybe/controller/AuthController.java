package com.nutrifybe.controller;

import com.nutrifybe.entity.Admin;
import com.nutrifybe.entity.Nutricionista;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private NutricionistaRepository nutricionistaRepository;

    @PostMapping("/admin-login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String senha = credentials.get("senha");

        Optional<Admin> admin = adminRepository.findByEmail(email);
        
        if (admin.isPresent() && admin.get().getSenha().equals(senha)) {
            Map<String, Object> response = new HashMap<>();
            response.put("token", "admin_token_" + admin.get().getId());
            
            Map<String, Object> user = new HashMap<>();
            user.put("id", admin.get().getId());
            user.put("nome", admin.get().getNome());
            user.put("email", admin.get().getEmail());
            user.put("type", "admin");
            
            response.put("user", user);
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(401).body(Map.of("error", "Credenciais inválidas"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginNutricionista(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String crn = credentials.get("crn");
        String senha = credentials.get("senha");

        Optional<Nutricionista> nutricionista = nutricionistaRepository.findByEmailAndCrn(email, crn);
        
        if (nutricionista.isPresent() && 
            nutricionista.get().getSenha().equals(senha) && 
            "approved".equals(nutricionista.get().getStatus()) && 
            nutricionista.get().getAtivo()) {
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", "nutri_token_" + nutricionista.get().getId());
            
            Map<String, Object> user = new HashMap<>();
            user.put("id", nutricionista.get().getId());
            user.put("nome", nutricionista.get().getNome());
            user.put("email", nutricionista.get().getEmail());
            user.put("crn", nutricionista.get().getCrn());
            user.put("type", "nutricionista");
            
            response.put("user", user);
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(401).body(Map.of("error", "Credenciais inválidas ou conta não aprovada"));
    }
}