package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "DiarioAgua")
public class DiarioAgua {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "quantidade_ml")
    private Integer quantidadeMl;

    @Column(name = "criado_em")
    private String criadoEm;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long pacienteId) { this.pacienteId = pacienteId; }
    public Integer getQuantidadeMl() { return quantidadeMl; }
    public void setQuantidadeMl(Integer quantidadeMl) { this.quantidadeMl = quantidadeMl; }
    public String getCriadoEm() { return criadoEm; }
    public void setCriadoEm(String criadoEm) { this.criadoEm = criadoEm; }
}
