package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "DiarioMedidas")
public class DiarioMedida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    private String peso;

    private String cintura;

    private String quadril;

    private String braco;

    @Column(name = "gordura_corporal")
    private String gorduraCorporal;

    @Column(name = "criado_em")
    private String criadoEm;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long pacienteId) { this.pacienteId = pacienteId; }
    public String getPeso() { return peso; }
    public void setPeso(String peso) { this.peso = peso; }
    public String getCintura() { return cintura; }
    public void setCintura(String cintura) { this.cintura = cintura; }
    public String getQuadril() { return quadril; }
    public void setQuadril(String quadril) { this.quadril = quadril; }
    public String getBraco() { return braco; }
    public void setBraco(String braco) { this.braco = braco; }
    public String getGorduraCorporal() { return gorduraCorporal; }
    public void setGorduraCorporal(String gorduraCorporal) { this.gorduraCorporal = gorduraCorporal; }
    public String getCriadoEm() { return criadoEm; }
    public void setCriadoEm(String criadoEm) { this.criadoEm = criadoEm; }
}
