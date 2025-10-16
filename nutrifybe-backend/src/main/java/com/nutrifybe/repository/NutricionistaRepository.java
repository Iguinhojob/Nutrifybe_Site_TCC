package com.nutrifybe.repository;

import com.nutrifybe.entity.Nutricionista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface NutricionistaRepository extends JpaRepository<Nutricionista, Long> {
    Optional<Nutricionista> findByEmailAndCrn(String email, String crn);
    Optional<Nutricionista> findByEmail(String email);
    Optional<Nutricionista> findByCrn(String crn);
    List<Nutricionista> findByStatusAndAtivo(String status, Boolean ativo);
    List<Nutricionista> findByStatus(String status);
    Optional<Nutricionista> findByEmailAndCrnAndSenha(String email, String crn, String senha);
}