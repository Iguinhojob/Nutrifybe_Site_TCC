package com.nutrifybe.controller;

import com.nutrifybe.entity.ActivityLog;
import com.nutrifybe.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-log")
@CrossOrigin(origins = "*")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<ActivityLog> listarTodos() {
        return activityLogRepository.findAllByOrderByTimestampDesc();
    }

    @PostMapping
    public ActivityLog criar(@RequestBody ActivityLog log) {
        return activityLogRepository.save(log);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (activityLogRepository.existsById(id)) {
            activityLogRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> limparTodos() {
        activityLogRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}