package com.nutrifybe.controller;

import com.nutrifybe.entity.Admin;
import com.nutrifybe.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminRepository adminRepository;

    @GetMapping
    public List<Admin> listarTodos() {
        return adminRepository.findAll();
    }

    @PostMapping
    public Admin criar(@RequestBody Admin admin) {
        return adminRepository.save(admin);
    }
}