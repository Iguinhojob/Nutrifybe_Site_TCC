package com.nutrifybe.controller;

import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.repository.NutricionistaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/nutricionistas")
public class NutricionistasController {

    private final NutricionistaRepository repository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public NutricionistasController(NutricionistaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Nutricionista> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Nutricionista nutricionista) {
        nutricionista.setSenha(passwordEncoder.encode(nutricionista.getSenha()));
        repository.save(nutricionista);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String crn = body.get("crn");
        String senha = body.get("senha");

        Optional<Nutricionista> nutri = repository.findByEmailAndCrnAndStatusAndAtivo(email, crn, "approved", 1);

        if (nutri.isPresent() && passwordEncoder.matches(senha, nutri.get().getSenha())) {
            return ResponseEntity.ok(Map.of("success", true, "nutricionista", nutri.get()));
        }
        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Credenciais inválidas"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(nutri -> {
            if (body.containsKey("status")) nutri.setStatus((String) body.get("status"));
            if (body.containsKey("ativo")) nutri.setAtivo((Integer) body.get("ativo"));
            repository.save(nutri);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
