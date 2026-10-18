package com.nutrifybe.repository;

import com.nutrifybe.model.NotificacaoPaciente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificacaoPacienteRepository extends JpaRepository<NotificacaoPaciente, Long> {
    List<NotificacaoPaciente> findTop100ByPacienteIdOrderByIdDesc(Long pacienteId);
    Optional<NotificacaoPaciente> findByIdAndPacienteId(Long id, Long pacienteId);
}
