package com.nutrifybe.repository;

import com.nutrifybe.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    boolean existsByEmailIgnoreCase(String email);
    Optional<Paciente> findFirstByEmailIgnoreCaseAndSenhaIsNotNull(String email);
}
