package com.nutrifybe.repository;

import com.nutrifybe.model.AvaliacaoNutricionista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvaliacaoNutricionistaRepository extends JpaRepository<AvaliacaoNutricionista, Long> {
    java.util.List<AvaliacaoNutricionista> findTop100ByNutricionistaIdOrderByCriadoEmDesc(Long nutricionistaId);
    long countByNutricionistaId(Long nutricionistaId);

    @Query("select avg(a.nota) from AvaliacaoNutricionista a where a.nutricionistaId = :nutricionistaId")
    Double averageNota(@Param("nutricionistaId") Long nutricionistaId);
}
