package com.nutrifybe.repository;

import com.nutrifybe.model.DiarioAgua;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiarioAguaRepository extends JpaRepository<DiarioAgua, Long> {
    List<DiarioAgua> findByPacienteIdOrderByCriadoEmDesc(Long pacienteId);
    Optional<DiarioAgua> findByIdAndPacienteId(Long id, Long pacienteId);
    Optional<DiarioAgua> findFirstByPacienteIdAndReferenciaId(Long pacienteId, String referenciaId);
}
