package com.nutrifybe.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "SolicitacoesPendentes")
public class SolicitacaoPendente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String email;
    private Integer idade;
    private Double peso;
    private Double altura;
    private String objetivo;
    private String condicaoSaude;
    private Long nutricionistaId;
    @Column(name = "dataCriacao")
    private Instant dataCriacao;

    @PrePersist
    void onCreate() { if (dataCriacao == null) dataCriacao = Instant.now(); }

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
    public Instant getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(Instant dataCriacao) { this.dataCriacao = dataCriacao; }
    @Transient
    public Instant getExpiraEm() { return dataCriacao == null ? null : dataCriacao.plus(24, ChronoUnit.HOURS); }
    @Transient
    public boolean isExpirada() { return dataCriacao == null || !Instant.now().isBefore(dataCriacao.plus(24, ChronoUnit.HOURS)); }
}
