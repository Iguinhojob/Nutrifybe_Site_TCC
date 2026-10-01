package com.nutrifybe.repository;

import com.nutrifybe.model.SolicitacaoPendente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SolicitacaoPendenteRepository extends JpaRepository<SolicitacaoPendente, Long> {
    boolean existsByEmailIgnoreCaseAndNutricionistaId(String email, Long nutricionistaId);
    List<SolicitacaoPendente> findByNutricionistaIdOrderByIdDesc(Long nutricionistaId);
    Optional<SolicitacaoPendente> findByIdAndNutricionistaId(Long id, Long nutricionistaId);
}
