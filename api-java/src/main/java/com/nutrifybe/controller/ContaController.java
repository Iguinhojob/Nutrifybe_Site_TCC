package com.nutrifybe.controller;

import com.nutrifybe.model.Admin;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/conta")
public class ContaController {
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;
    private final AdminRepository admins;
    private final TokenService tokens;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, Verification> verifications = new ConcurrentHashMap<>();

    private record Account(String type, Long id, String email, String name) {}
    private record Verification(String destination, String hash, Instant expires, AtomicInteger attempts) {}

    public ContaController(PacienteRepository pacientes, NutricionistaRepository nutricionistas,
                           AdminRepository admins, TokenService tokens, JavaMailSender mailSender) {
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
        this.admins = admins;
        this.tokens = tokens;
        this.mailSender = mailSender;
    }

    @PostMapping("/codigo-senha")
    public ResponseEntity<?> sendPasswordCode(@RequestHeader(value = "Authorization", required = false) String auth) {
        Account account = account(auth);
        if (account == null) return error(401, "Session invalid.");
        return sendCode(account, "password", account.email(), "Use este codigo para confirmar a alteracao de senha.");
    }

    @PostMapping("/senha")
    public ResponseEntity<?> changePassword(@RequestHeader(value = "Authorization", required = false) String auth,
                                            @RequestBody Map<String, String> body) {
        Account account = account(auth);
        if (account == null) return error(401, "Session invalid.");
        String code = body.get("codigo"), password = body.get("novaSenha");
        if (password == null || password.length() < 6) return error(400, "A nova senha deve ter pelo menos 6 caracteres.");
        if (!verify(account, "password", account.email(), code)) return error(400, "Codigo invalido ou expirado. Solicite outro.");
        String hash = encoder.encode(password);
        boolean saved = switch (account.type()) {
            case "patient" -> pacientes.findById(account.id()).map(p -> { p.setSenha(hash); pacientes.save(p); return true; }).orElse(false);
            case "nutritionist" -> nutricionistas.findById(account.id()).map(n -> { n.setSenha(hash); nutricionistas.save(n); return true; }).orElse(false);
            default -> admins.findById(account.id()).map(a -> { a.setSenha(hash); admins.save(a); return true; }).orElse(false);
        };
        return saved ? ResponseEntity.ok(Map.of("success", true)) : error(404, "Account not found.");
    }

    @PostMapping("/codigo-email")
    public ResponseEntity<?> sendEmailCode(@RequestHeader(value = "Authorization", required = false) String auth,
                                           @RequestBody Map<String, String> body) {
        Account account = account(auth);
        if (account == null) return error(401, "Session invalid.");
        String email = body.get("email");
        if (email == null || !email.matches("(?i)^[^\\s@]+@[^\\s@.]+(?:\\.[^\\s@.]+)+$")) return error(400, "Informe um e-mail valido.");
        email = email.trim().toLowerCase();
        if (email.equalsIgnoreCase(account.email())) return error(400, "Este ja e o e-mail atual da conta.");
        if (emailTaken(email, account)) return error(409, "Este e-mail ja esta em uso.");
        return sendCode(account, "email", email, "Use este codigo para confirmar o novo e-mail da sua conta.");
    }

    @PostMapping("/email")
    public ResponseEntity<?> changeEmail(@RequestHeader(value = "Authorization", required = false) String auth,
                                         @RequestBody Map<String, String> body) {
        Account account = account(auth);
        if (account == null) return error(401, "Session invalid.");
        String email = body.get("email"), code = body.get("codigo");
        if (email == null) return error(400, "Informe o novo e-mail.");
        email = email.trim().toLowerCase();
        if (emailTaken(email, account)) return error(409, "Este e-mail ja esta em uso.");
        if (!verify(account, "email", email, code)) return error(400, "Codigo invalido ou expirado. Solicite outro.");
        String verifiedEmail = email;
        boolean saved = switch (account.type()) {
            case "patient" -> pacientes.findById(account.id()).map(p -> { p.setEmail(verifiedEmail); pacientes.save(p); return true; }).orElse(false);
            case "nutritionist" -> nutricionistas.findById(account.id()).map(n -> { n.setEmail(verifiedEmail); nutricionistas.save(n); return true; }).orElse(false);
            default -> admins.findById(account.id()).map(a -> { a.setEmail(verifiedEmail); admins.save(a); return true; }).orElse(false);
        };
        return saved ? ResponseEntity.ok(Map.of("success", true, "email", verifiedEmail)) : error(404, "Account not found.");
    }

    private ResponseEntity<?> sendCode(Account account, String purpose, String email, String instruction) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        String key = key(account, purpose);
        Verification verification = new Verification(email, hash(code), Instant.now().plusSeconds(600), new AtomicInteger());
        verifications.put(key, verification);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Nutrifybe - codigo de verificacao");
        message.setText("Ola, " + account.name() + ".\n\n" + instruction + "\n\nCodigo: " + code + "\n\nEste codigo expira em 10 minutos. Se voce nao solicitou, ignore este e-mail.");
        try {
            mailSender.send(message);
            return ResponseEntity.ok(Map.of("success", true, "message", "Se o e-mail estiver acessivel, voce recebera um codigo valido por 10 minutos."));
        } catch (RuntimeException e) {
            verifications.remove(key, verification);
            return error(503, "Nao foi possivel enviar o e-mail de verificacao. Tente novamente mais tarde.");
        }
    }

    private boolean verify(Account account, String purpose, String email, String code) {
        if (code == null) return false;
        String key = key(account, purpose);
        Verification value = verifications.get(key);
        if (value == null || Instant.now().isAfter(value.expires()) || !value.destination().equalsIgnoreCase(email)) {
            if (value != null && Instant.now().isAfter(value.expires())) verifications.remove(key, value);
            return false;
        }
        boolean matches = MessageDigest.isEqual(hash(code.trim()).getBytes(StandardCharsets.UTF_8), value.hash().getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            if (value.attempts().incrementAndGet() >= 5) verifications.remove(key, value);
            return false;
        }
        return verifications.remove(key, value);
    }

    private Account account(String auth) {
        Long id = tokens.validar(auth);
        if (id != null) {
            Long patientId = id;
            return pacientes.findById(patientId).map(p -> new Account("patient", patientId, p.getEmail(), p.getNome())).orElse(null);
        }
        id = tokens.validarNutricionista(auth);
        if (id != null) {
            Long nutritionistId = id;
            return nutricionistas.findById(nutritionistId).map(n -> new Account("nutritionist", nutritionistId, n.getEmail(), n.getNome())).orElse(null);
        }
        id = tokens.validarAdmin(auth);
        if (id != null) {
            Long adminId = id;
            return admins.findById(adminId).map(a -> new Account("admin", adminId, a.getEmail(), a.getNome())).orElse(null);
        }
        return null;
    }

    private boolean emailTaken(String email, Account current) {
        return pacientes.findAll().stream().anyMatch(p -> email.equalsIgnoreCase(p.getEmail()) && !("patient".equals(current.type()) && current.id().equals(p.getId())))
                || nutricionistas.findAll().stream().anyMatch(n -> email.equalsIgnoreCase(n.getEmail()) && !("nutritionist".equals(current.type()) && current.id().equals(n.getId())))
                || admins.findAll().stream().anyMatch(a -> email.equalsIgnoreCase(a.getEmail()) && !("admin".equals(current.type()) && current.id().equals(a.getId())));
    }

    private static String key(Account account, String purpose) { return account.type() + ":" + account.id() + ":" + purpose; }
    private static String hash(String value) {
        try { return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    private static ResponseEntity<?> error(int status, String message) { return ResponseEntity.status(status).body(Map.of("success", false, "message", message)); }
}
