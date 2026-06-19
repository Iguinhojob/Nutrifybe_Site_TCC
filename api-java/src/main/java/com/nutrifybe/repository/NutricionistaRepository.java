package com.nutrifybe.repository;

import com.nutrifybe.model.Nutricionista;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Long> {
    Optional<Nutricionista> findByEmailAndCrnAndStatusAndAtivo(String email, String crn, String status, Integer ativo);
}
