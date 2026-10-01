package com.nutrifybe.repository;

import com.nutrifybe.model.DiarioRefeicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiarioRefeicaoRepository extends JpaRepository<DiarioRefeicao, Long> {
    List<DiarioRefeicao> findByPacienteIdOrderByCriadoEmDesc(Long pacienteId);
    Optional<DiarioRefeicao> findByIdAndPacienteId(Long id, Long pacienteId);
    Optional<DiarioRefeicao> findFirstByPacienteIdAndReferenciaId(Long pacienteId, String referenciaId);
}
