package com.nutrifybe.controller;

import com.nutrifybe.repository.NotificacaoPacienteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoPacienteController {
    private final NotificacaoPacienteRepository notificacoes;
    private final TokenService tokens;
    public NotificacaoPacienteController(NotificacaoPacienteRepository notificacoes, TokenService tokens) {
        this.notificacoes = notificacoes; this.tokens = tokens;
    }
    @GetMapping
    public ResponseEntity<?> listar(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return ResponseEntity.status(401).body(Map.of("message", "Sessão inválida"));
        return ResponseEntity.ok(notificacoes.findTop100ByPacienteIdOrderByIdDesc(id));
    }
    @PutMapping("/{id}/lida")
    public ResponseEntity<?> marcarLida(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        Long pacienteId = tokens.validar(auth);
        if (pacienteId == null) return ResponseEntity.status(401).body(Map.of("message", "Sessão inválida"));
        return notificacoes.findByIdAndPacienteId(id, pacienteId).map(n -> {
            n.setLida(true); notificacoes.save(n); return ResponseEntity.ok(Map.of("success", true));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
