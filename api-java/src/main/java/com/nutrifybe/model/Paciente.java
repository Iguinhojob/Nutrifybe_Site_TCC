package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Pacientes")
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String email;
    private Integer idade;
    private Double peso;
    private Double altura;
    private String objetivo;

    @Column(name = "condicao_saude")
    private String condicaoSaude;

    @Column(name = "nutricionista_id")
    private Long nutricionistaId;

    private String status;
    private Integer ativo;

    @Column(name = "prescricao_semanal", columnDefinition = "NVARCHAR(MAX)")
    private String prescricaoSemanal;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String calendario;

    @Column(name = "data_criacao")
    private String dataCriacao;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }
    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }
    public Double getAltura() { return altura; }
    public void setAltura(Double altura) { this.altura = altura; }
    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }
    public String getCondicaoSaude() { return condicaoSaude; }
    public void setCondicaoSaude(String condicaoSaude) { this.condicaoSaude = condicaoSaude; }
    public Long getNutricionistaId() { return nutricionistaId; }
    public void setNutricionistaId(Long nutricionistaId) { this.nutricionistaId = nutricionistaId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAtivo() { return ativo; }
    public void setAtivo(Integer ativo) { this.ativo = ativo; }
    public String getPrescricaoSemanal() { return prescricaoSemanal; }
    public void setPrescricaoSemanal(String prescricaoSemanal) { this.prescricaoSemanal = prescricaoSemanal; }
    public String getCalendario() { return calendario; }
    public void setCalendario(String calendario) { this.calendario = calendario; }
    public String getDataCriacao() { return dataCriacao; }
}
