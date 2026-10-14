package com.nutrifybe.controller;

import com.nutrifybe.model.ActivityLog;
import com.nutrifybe.model.Admin;
import com.nutrifybe.repository.ActivityLogRepository;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Rotas administrativas. O login é feito no servidor (a senha nunca é enviada ao navegador)
 * e todas as demais rotas exigem o token de administrador no cabeçalho Authorization.
 */
@RestController
public class AdminController {

    private final AdminRepository adminRepository;
    private final ActivityLogRepository activityLogRepository;
    private final TokenService tokens;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AdminController(AdminRepository adminRepository, ActivityLogRepository activityLogRepository, TokenService tokens) {
        this.adminRepository = adminRepository;
        this.activityLogRepository = activityLogRepository;
        this.tokens = tokens;
    }

    @PostMapping("/api/admin/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email") == null ? "" : body.get("email").trim();
        String senha = body.get("senha") == null ? "" : body.get("senha");
        Optional<Admin> encontrado = adminRepository.findAll().stream()
                .filter(a -> a.getEmail() != null && a.getEmail().equalsIgnoreCase(email))
                .findFirst();
        if (encontrado.isEmpty() || !senhaConfere(encontrado.get(), senha)) {
            return erro(401, "E-mail ou senha incorretos");
        }
        Admin admin = encontrado.get();
        return ResponseEntity.ok(Map.of("success", true, "admin", publico(admin), "token", tokens.gerarAdmin(admin.getId())));
    }

    @GetMapping("/api/admin")
    public ResponseEntity<?> getAll(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        return ResponseEntity.ok(adminRepository.findAll().stream().map(this::publico).toList());
    }

    @PostMapping("/api/admin")
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestBody Map<String, Object> body) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        String senha = body.get("senha") == null ? "" : body.get("senha").toString();
        if (senha.length() < 6) return erro(400, "A senha do administrador deve ter pelo menos 6 caracteres");
        Admin admin = new Admin();
        admin.setNome(texto(body.get("nome")));
        admin.setEmail(texto(body.get("email")));
        admin.setFoto(texto(body.get("foto")));
        admin.setSenha(passwordEncoder.encode(senha));
        admin.setDataCriacao(Instant.now().toString());
        adminRepository.save(admin);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/api/admin/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        return adminRepository.findById(id).map(admin -> {
            if (body.containsKey("nome")) admin.setNome(texto(body.get("nome")));
            if (body.containsKey("email")) admin.setEmail(texto(body.get("email")));
            if (body.containsKey("senha") && body.get("senha") != null) admin.setSenha(passwordEncoder.encode(body.get("senha").toString()));
            if (body.containsKey("foto")) admin.setFoto(texto(body.get("foto")));
            adminRepository.save(admin);
            return ResponseEntity.ok((Object) Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        Long adminId = tokens.validarAdmin(auth);
        if (adminId == null) return naoAutorizado();
        if (adminId.equals(id)) return erro(400, "Você não pode excluir a própria conta");
        if (adminRepository.count() <= 1) return erro(400, "É preciso manter pelo menos um administrador");
        adminRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/api/activityLog")
    public ResponseEntity<?> getLogs(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        return ResponseEntity.ok(activityLogRepository.findAll());
    }

    @PostMapping("/api/activityLog")
    public ResponseEntity<?> addLog(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody ActivityLog log) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        activityLogRepository.save(log);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/api/activityLog")
    public ResponseEntity<?> clearLogs(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (tokens.validarAdmin(auth) == null) return naoAutorizado();
        activityLogRepository.deleteAll();
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * Aceita senhas já criptografadas (BCrypt) e, para contas antigas gravadas em texto puro,
     * confere a senha e a converte para BCrypt no primeiro login bem-sucedido.
     */
    private boolean senhaConfere(Admin admin, String senha) {
        String salva = admin.getSenha();
        if (salva == null || senha.isEmpty()) return false;
        if (salva.startsWith("$2a$") || salva.startsWith("$2b$") || salva.startsWith("$2y$")) {
            return passwordEncoder.matches(senha, salva);
        }
        if (!java.security.MessageDigest.isEqual(salva.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                senha.getBytes(java.nio.charset.StandardCharsets.UTF_8))) return false;
        admin.setSenha(passwordEncoder.encode(senha));
        adminRepository.save(admin);
        return true;
    }

    private Map<String, Object> publico(Admin a) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("id", a.getId());
        dados.put("nome", a.getNome());
        dados.put("email", a.getEmail());
        dados.put("foto", a.getFoto());
        dados.put("dataCriacao", a.getDataCriacao());
        return dados;
    }

    private static String texto(Object valor) {
        return valor == null ? null : valor.toString();
    }

    private ResponseEntity<?> naoAutorizado() {
        return erro(401, "Sessão de administrador inválida ou expirada. Entre novamente.");
    }

    private ResponseEntity<?> erro(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", message));
    }
}
