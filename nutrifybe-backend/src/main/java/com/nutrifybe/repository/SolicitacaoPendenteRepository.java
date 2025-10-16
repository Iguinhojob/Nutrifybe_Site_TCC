package com.nutrifybe.repository;

import com.nutrifybe.entity.SolicitacaoPendente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SolicitacaoPendenteRepository extends JpaRepository<SolicitacaoPendente, Long> {
    List<SolicitacaoPendente> findByNutricionistaId(Long nutricionistaId);
    List<SolicitacaoPendente> findByAtivo(Boolean ativo);
}