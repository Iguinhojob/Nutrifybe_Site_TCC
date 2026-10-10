package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "alimentos")
public class Alimento {
    @Id
    private Long id;
    @Column(nullable = false, length = 300) private String nome;
    @Column(length = 160) private String categoria;
    @Column(name = "kcal_100g", nullable = false) private Double kcal100g;
    @Column(name = "proteina_100g", nullable = false) private Double proteina100g;
    @Column(name = "gordura_100g", nullable = false) private Double gordura100g;
    @Column(name = "carboidrato_100g", nullable = false) private Double carboidrato100g;
    @Column(name = "fibra_100g", nullable = false) private Double fibra100g;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public Double getKcal100g() { return kcal100g; }
    public void setKcal100g(Double value) { kcal100g = value; }
    public Double getProteina100g() { return proteina100g; }
    public void setProteina100g(Double value) { proteina100g = value; }
    public Double getGordura100g() { return gordura100g; }
    public void setGordura100g(Double value) { gordura100g = value; }
    public Double getCarboidrato100g() { return carboidrato100g; }
    public void setCarboidrato100g(Double value) { carboidrato100g = value; }
    public Double getFibra100g() { return fibra100g; }
    public void setFibra100g(Double value) { fibra100g = value; }
}
