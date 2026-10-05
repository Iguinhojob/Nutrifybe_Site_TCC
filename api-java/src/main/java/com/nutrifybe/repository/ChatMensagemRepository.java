package com.nutrifybe.repository;

import com.nutrifybe.model.ChatMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChatMensagemRepository extends JpaRepository<ChatMensagem, Long> {
    List<ChatMensagem> findTop100ByPacienteIdAndNutricionistaIdOrderByIdDesc(Long pacienteId, Long nutricionistaId);
    Optional<ChatMensagem> findByIdAndPacienteIdAndNutricionistaId(Long id, Long pacienteId, Long nutricionistaId);
}
