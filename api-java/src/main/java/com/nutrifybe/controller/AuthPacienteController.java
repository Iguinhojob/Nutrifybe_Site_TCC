package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Cadastro, login e perfil do paciente (usado pelo app mobile). */
@RestController
@RequestMapping("/api/auth/paciente")
public class AuthPacienteController {

    private final PacienteRepository repository;
    private final TokenService tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthPacienteController(PacienteRepository repository, TokenService tokens) {
        this.repository = repository;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        String nome = Campos.texto(body.get("nome"));
        String email = Campos.texto(body.get("email"));
        String senha = body.get("senha") == null ? null : body.get("senha").toString();

        if (nome == null || email == null || !email.contains("@")) {
            return erro(400, "Informe nome e e-mail válidos");
        }
        if (senha == null || senha.length() < 6) {
            return erro(400, "A senha precisa ter pelo menos 6 caracteres");
        }
        String emailFinal = email.toLowerCase();
        if (repository.existsByEmailIgnoreCase(emailFinal)) {
            return erro(409, "E-mail já cadastrado");
        }

        Paciente p = new Paciente();
        p.setNome(nome);
        p.setEmail(emailFinal);
        p.setSenha(encoder.encode(senha));
        p.setIdade(Campos.inteiro(body.get("idade")));
        p.setPeso(Campos.decimal(body.get("peso")));
        p.setAltura(Campos.decimal(body.get("altura")));
        p.setObjetivo(Campos.texto(body.get("objetivo")));
        p.setCondicaoSaude(Campos.texto(body.get("condicaoSaude")));
        p.setStatus("solo");
        p.setAtivo(1);
        p.setDataCriacao(Instant.now().toString());
        repository.save(p);
        return ResponseEntity.ok(resposta(p));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email = Campos.texto(body.get("email"));
        String senha = body.get("senha") == null ? null : body.get("senha").toString();
        if (email == null || senha == null) {
            return erro(400, "Informe e-mail e senha");
        }

        Optional<Paciente> op = repository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(email);
        if (op.isEmpty() || !encoder.matches(senha, op.get().getSenha())) {
            return erro(401, "E-mail ou senha inválidos");
        }
        Paciente p = op.get();
        if (p.getAtivo() != null && p.getAtivo() == 0) {
            return erro(403, "Conta inativa");
        }
        return ResponseEntity.ok(resposta(p));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");
        return ResponseEntity.ok(op.get());
    }

    @PutMapping("/me")
    public ResponseEntity<?> atualizar(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");

        Paciente p = op.get();
        if (Campos.texto(body.get("nome")) != null) p.setNome(Campos.texto(body.get("nome")));
        if (body.containsKey("idade")) p.setIdade(Campos.inteiro(body.get("idade")));
        if (body.containsKey("peso")) p.setPeso(Campos.decimal(body.get("peso")));
        if (body.containsKey("altura")) p.setAltura(Campos.decimal(body.get("altura")));
        if (body.containsKey("objetivo")) p.setObjetivo(Campos.texto(body.get("objetivo")));
        if (body.containsKey("condicaoSaude")) p.setCondicaoSaude(Campos.texto(body.get("condicaoSaude")));
        repository.save(p);
        return ResponseEntity.ok(p);
    }

    private Map<String, Object> resposta(Paciente p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("token", tokens.gerar(p.getId()));
        m.put("paciente", p);
        return m;
    }

    private ResponseEntity<?> erro(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", mensagem));
    }
}
