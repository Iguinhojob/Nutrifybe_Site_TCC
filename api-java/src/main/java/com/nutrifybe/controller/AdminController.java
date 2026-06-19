package com.nutrifybe.controller;

import com.nutrifybe.model.Admin;
import com.nutrifybe.model.ActivityLog;
import com.nutrifybe.repository.AdminRepository;
import com.nutrifybe.repository.ActivityLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class AdminController {

    private final AdminRepository adminRepository;
    private final ActivityLogRepository activityLogRepository;

    public AdminController(AdminRepository adminRepository, ActivityLogRepository activityLogRepository) {
        this.adminRepository = adminRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping("/api/admin")
    public List<Admin> getAll() {
        return adminRepository.findAll();
    }

    @PostMapping("/api/admin")
    public ResponseEntity<?> create(@RequestBody Admin admin) {
        adminRepository.save(admin);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/api/admin/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return adminRepository.findById(id).map(admin -> {
            if (body.containsKey("nome")) admin.setNome((String) body.get("nome"));
            if (body.containsKey("email")) admin.setEmail((String) body.get("email"));
            if (body.containsKey("senha")) admin.setSenha((String) body.get("senha"));
            if (body.containsKey("foto")) admin.setFoto((String) body.get("foto"));
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/admin/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        adminRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/api/activityLog")
    public List<ActivityLog> getLogs() {
        return activityLogRepository.findAll();
    }

    @PostMapping("/api/activityLog")
    public ResponseEntity<?> addLog(@RequestBody ActivityLog log) {
        activityLogRepository.save(log);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/api/activityLog")
    public ResponseEntity<?> clearLogs() {
        activityLogRepository.deleteAll();
        return ResponseEntity.ok(Map.of("success", true));
    }
}
