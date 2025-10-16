package com.nutrifybe.repository;

import com.nutrifybe.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    List<Paciente> findByNutricionistaId(Long nutricionistaId);
    List<Paciente> findByAtivo(Boolean ativo);
}