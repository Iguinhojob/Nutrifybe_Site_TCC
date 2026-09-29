package com.nutrifybe.repository;

import com.nutrifybe.model.DiarioMedida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiarioMedidaRepository extends JpaRepository<DiarioMedida, Long> {
    List<DiarioMedida> findByPacienteIdOrderByCriadoEmDesc(Long pacienteId);
    Optional<DiarioMedida> findByIdAndPacienteId(Long id, Long pacienteId);
}
