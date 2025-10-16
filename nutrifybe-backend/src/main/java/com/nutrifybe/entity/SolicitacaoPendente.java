package com.nutrifybe.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "SolicitacoesPendentes")
public class SolicitacaoPendente {
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
    
    private Boolean ativo = true;
    
    @Column(name = "dataSolicitacao")
    private LocalDateTime dataSolicitacao = LocalDateTime.now();

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
    
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    
    public LocalDateTime getDataSolicitacao() { return dataSolicitacao; }
    public void setDataSolicitacao(LocalDateTime dataSolicitacao) { this.dataSolicitacao = dataSolicitacao; }
}