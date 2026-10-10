package com.nutrifybe.repository;

import com.nutrifybe.model.Alimento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlimentoRepository extends JpaRepository<Alimento, Long> {}
