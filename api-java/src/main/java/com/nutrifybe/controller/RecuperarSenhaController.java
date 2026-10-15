package com.nutrifybe.controller;

import com.nutrifybe.model.Admin;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/recuperar-senha")
public class RecuperarSenhaController {

    private final NutricionistaRepository nutricionistaRepository;
    private final AdminRepository adminRepository;
    private final PacienteRepository pacienteRepository;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.frontend.url}")
    private String frontendUrl;
    @Value("${spring.mail.username:}")
    private String mailUsername;
    @Value("${spring.mail.password:}")
    private String mailPassword;

    // token -> { userId, tipo, expiry }
    private final ConcurrentHashMap<String, TokenData> tokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ResetCode> resetCodes = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    private record TokenData(Long userId, String tipo, Instant expiry) {}
    private record ResetCode(String hash, TokenData account, java.util.concurrent.atomic.AtomicInteger attempts) {}

    public RecuperarSenhaController(NutricionistaRepository nutricionistaRepository,
                                    AdminRepository adminRepository,
                                    PacienteRepository pacienteRepository,
                                    JavaMailSender mailSender) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.adminRepository = adminRepository;
        this.pacienteRepository = pacienteRepository;
        this.mailSender = mailSender;
    }

    @PostMapping("/solicitar")
    public ResponseEntity<?> solicitar(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "E-mail obrigatório."));
        }
        if (mailUsername == null || mailUsername.isBlank() || mailPassword == null || mailPassword.isBlank()) {
            return ResponseEntity.status(503).body(Map.of("message", "O envio de e-mails nao esta configurado. Preencha MAIL_USER e MAIL_PASS no arquivo api-java/.env e reinicie o backend."));
        }

        Long userId = null;
        String tipo = null;
        String nomeUsuario = null;

        if ("paciente".equalsIgnoreCase(body.get("tipo"))) {
            Optional<Paciente> paciente = pacienteRepository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(email);
            if (paciente.isPresent()) {
                userId = paciente.get().getId();
                tipo = "paciente";
                nomeUsuario = paciente.get().getNome();
            }
        }

        if (userId == null) {
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
        }

        // Sempre retorna sucesso para não revelar se o e-mail existe
        if (userId == null && !"paciente".equalsIgnoreCase(body.get("tipo"))) {
            Optional<Paciente> paciente = pacienteRepository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(email);
            if (paciente.isPresent()) {
                userId = paciente.get().getId();
                tipo = "paciente";
                nomeUsuario = paciente.get().getNome();
            }
        }

        if (userId == null) {
            return ResponseEntity.ok(Map.of("message", "Se este e-mail estiver cadastrado, você receberá as instruções."));
        }

        String token = UUID.randomUUID().toString();
        tokens.put(token, new TokenData(userId, tipo, Instant.now().plusSeconds(3600))); // 1 hora
        String codigo = String.format("%06d", random.nextInt(1_000_000));
        TokenData conta = new TokenData(userId, tipo, Instant.now().plusSeconds(600));
        resetCodes.put(email.trim().toLowerCase(), new ResetCode(hash(codigo), conta, new java.util.concurrent.atomic.AtomicInteger()));

        String link = frontendUrl + "/recuperar-senha?token=" + token;

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(email);
        mail.setSubject("Nutrifybe — Redefinição de Senha");
        mail.setText(
            "Olá, " + nomeUsuario + "!\n\n" +
            "Recebemos uma solicitação para redefinir a senha da sua conta no Nutrifybe.\n\n" +
            "Clique no link abaixo para criar uma nova senha (válido por 1 hora):\n\n" +
            link + "\n\n" +
            "No aplicativo, use este codigo para redefinir a senha (valido por 10 minutos): " + codigo + "\n\n" +
            "Se você não solicitou isso, ignore este e-mail.\n\n" +
            "Equipe Nutrifybe"
        );
        try {
            mailSender.send(mail);
        } catch (RuntimeException e) {
            tokens.remove(token);
            resetCodes.remove(email.trim().toLowerCase());
            return ResponseEntity.status(503).body(Map.of("message", "O servidor recebeu o pedido, mas nao conseguiu enviar o e-mail. Configure MAIL_USER e MAIL_PASS do SMTP e tente novamente."));
        }

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

        if (!atualizarSenha(data, novaSenha)) return ResponseEntity.badRequest().body(Map.of("message", "Conta nao encontrada."));

        invalidarRecuperacoes(data);
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

    @PostMapping("/redefinir-codigo")
    public ResponseEntity<?> redefinirPorCodigo(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String codigo = body.get("codigo");
        String novaSenha = body.get("novaSenha");
        if (email == null || codigo == null || novaSenha == null || novaSenha.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Informe e-mail, codigo e senha com pelo menos 6 caracteres."));
        }
        String chave = email.trim().toLowerCase();
        ResetCode reset = resetCodes.get(chave);
        if (reset == null || Instant.now().isAfter(reset.account().expiry())) {
            if (reset != null) resetCodes.remove(chave, reset);
            return ResponseEntity.badRequest().body(Map.of("message", "Codigo invalido ou expirado. Solicite outro."));
        }
        if (!MessageDigest.isEqual(hash(codigo).getBytes(StandardCharsets.UTF_8), reset.hash().getBytes(StandardCharsets.UTF_8))) {
            if (reset.attempts().incrementAndGet() >= 5) resetCodes.remove(chave, reset);
            return ResponseEntity.badRequest().body(Map.of("message", "Codigo invalido ou expirado. Solicite outro."));
        }
        if (!atualizarSenha(reset.account(), novaSenha)) {
            resetCodes.remove(chave, reset);
            return ResponseEntity.badRequest().body(Map.of("message", "Conta nao encontrada."));
        }
        resetCodes.remove(chave, reset);
        invalidarRecuperacoes(reset.account());
        return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso!"));
    }

    private void invalidarRecuperacoes(TokenData account) {
        tokens.entrySet().removeIf(entry -> entry.getValue().userId().equals(account.userId()) && entry.getValue().tipo().equals(account.tipo()));
        resetCodes.entrySet().removeIf(entry -> entry.getValue().account().userId().equals(account.userId()) && entry.getValue().account().tipo().equals(account.tipo()));
    }

    private boolean atualizarSenha(TokenData data, String novaSenha) {
        String senhaHash = passwordEncoder.encode(novaSenha);
        if ("nutri".equals(data.tipo())) return nutricionistaRepository.findById(data.userId()).map(n -> { n.setSenha(senhaHash); nutricionistaRepository.save(n); return true; }).orElse(false);
        if ("paciente".equals(data.tipo())) return pacienteRepository.findById(data.userId()).map(p -> { p.setSenha(senhaHash); pacienteRepository.save(p); return true; }).orElse(false);
        return adminRepository.findById(data.userId()).map(a -> { a.setSenha(senhaHash); adminRepository.save(a); return true; }).orElse(false);
    }

    private static String hash(String value) {
        try { return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
