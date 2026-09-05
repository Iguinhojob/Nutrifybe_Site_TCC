package com.nutrifybe.controller;

import com.nutrifybe.model.Admin;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/recuperar-senha")
public class RecuperarSenhaController {

    private final NutricionistaRepository nutricionistaRepository;
    private final AdminRepository adminRepository;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // token -> { userId, tipo, expiry }
    private final ConcurrentHashMap<String, TokenData> tokens = new ConcurrentHashMap<>();

    private record TokenData(Long userId, String tipo, Instant expiry) {}

    public RecuperarSenhaController(NutricionistaRepository nutricionistaRepository,
                                    AdminRepository adminRepository,
                                    JavaMailSender mailSender) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.adminRepository = adminRepository;
        this.mailSender = mailSender;
    }

    @PostMapping("/solicitar")
    public ResponseEntity<?> solicitar(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail obrigatório."));
        }

        Long userId = null;
        String tipo = null;
        String nomeUsuario = null;

        Optional<Nutricionista> nutri = nutricionistaRepository.findAll()
                .stream().filter(n -> email.equalsIgnoreCase(n.getEmail())).findFirst();

        if (nutri.isPresent()) {
            userId = nutri.get().getId();
            tipo = "nutri";
            nomeUsuario = nutri.get().getNome();
        } else {
            Optional<Admin> admin = adminRepository.findAll()
                    .stream().filter(a -> email.equalsIgnoreCase(a.getEmail())).findFirst();
            if (admin.isPresent()) {
                userId = admin.get().getId();
                tipo = "admin";
                nomeUsuario = admin.get().getNome();
            }
        }

        // Sempre retorna sucesso para não revelar se o e-mail existe
        if (userId == null) {
            return ResponseEntity.ok(Map.of("message", "Se este e-mail estiver cadastrado, você receberá as instruções."));
        }

        String token = UUID.randomUUID().toString();
        tokens.put(token, new TokenData(userId, tipo, Instant.now().plusSeconds(3600))); // 1 hora

        String link = frontendUrl + "/recuperar-senha?token=" + token;

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(email);
        mail.setSubject("Nutrifybe — Redefinição de Senha");
        mail.setText(
            "Olá, " + nomeUsuario + "!\n\n" +
            "Recebemos uma solicitação para redefinir a senha da sua conta no Nutrifybe.\n\n" +
            "Clique no link abaixo para criar uma nova senha (válido por 1 hora):\n\n" +
            link + "\n\n" +
            "Se você não solicitou isso, ignore este e-mail.\n\n" +
            "Equipe Nutrifybe"
        );
        mailSender.send(mail);

        return ResponseEntity.ok(Map.of("message", "Se este e-mail estiver cadastrado, você receberá as instruções."));
    }

    @PostMapping("/redefinir")
    public ResponseEntity<?> redefinir(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String novaSenha = body.get("novaSenha");

        if (token == null || novaSenha == null || novaSenha.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos."));
        }

        TokenData data = tokens.get(token);
        if (data == null || Instant.now().isAfter(data.expiry())) {
            tokens.remove(token);
            return ResponseEntity.status(400).body(Map.of("message", "Link expirado ou inválido. Solicite um novo."));
        }

        String senhaHash = passwordEncoder.encode(novaSenha);

        if ("nutri".equals(data.tipo())) {
            nutricionistaRepository.findById(data.userId()).ifPresent(n -> {
                n.setSenha(senhaHash);
                nutricionistaRepository.save(n);
            });
        } else {
            adminRepository.findById(data.userId()).ifPresent(a -> {
                a.setSenha(senhaHash);
                adminRepository.save(a);
            });
        }

        tokens.remove(token);
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso!"));
    }

    @GetMapping("/validar")
    public ResponseEntity<?> validar(@RequestParam String token) {
        TokenData data = tokens.get(token);
        if (data == null || Instant.now().isAfter(data.expiry())) {
            tokens.remove(token);
            return ResponseEntity.status(400).body(Map.of("valid", false, "message", "Link expirado ou inválido."));
        }
        return ResponseEntity.ok(Map.of("valid", true));
    }
}
