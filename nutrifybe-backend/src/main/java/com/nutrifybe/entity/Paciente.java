package com.nutrifybe.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Pacientes")
public class Paciente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String nome;
    
    @Column(nullable = false, length = 100)
    private String email;
    
    private Integer idade;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal peso;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal altura;
    
    @Column(length = 255)
    private String objetivo;
    
    @Column(length = 255)
    private String condicaoSaude;
    
    @ManyToOne
    @JoinColumn(name = "nutricionistaId")
    private Nutricionista nutricionista;
    
    @Column(length = 20)
    private String status = "accepted";
    
    private Boolean ativo = true;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String prescricaoSemanal;
    
    @Column(name = "dataCriacao")
    private LocalDateTime dataCriacao = LocalDateTime.now();
    
    @Column(name = "dataUltimaAtualizacao")
    private LocalDateTime dataUltimaAtualizacao = LocalDateTime.now();

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }
    
    public BigDecimal getPeso() { return peso; }
    public void setPeso(BigDecimal peso) { this.peso = peso; }
    
    public BigDecimal getAltura() { return altura; }
    public void setAltura(BigDecimal altura) { this.altura = altura; }
    
    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }
    
    public String getCondicaoSaude() { return condicaoSaude; }
    public void setCondicaoSaude(String condicaoSaude) { this.condicaoSaude = condicaoSaude; }
    
    public Nutricionista getNutricionista() { return nutricionista; }
    public void setNutricionista(Nutricionista nutricionista) { this.nutricionista = nutricionista; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    
    public String getPrescricaoSemanal() { return prescricaoSemanal; }
    public void setPrescricaoSemanal(String prescricaoSemanal) { this.prescricaoSemanal = prescricaoSemanal; }
    
    public LocalDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    
    public LocalDateTime getDataUltimaAtualizacao() { return dataUltimaAtualizacao; }
    public void setDataUltimaAtualizacao(LocalDateTime dataUltimaAtualizacao) { this.dataUltimaAtualizacao = dataUltimaAtualizacao; }
}