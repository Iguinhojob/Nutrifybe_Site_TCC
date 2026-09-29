package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "DiarioRefeicoes")
public class DiarioRefeicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    private String nome;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String descricao;

    private Double calorias;

    private Double carboidratos;

    private Double proteinas;

    private Double gorduras;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String itens;

    private String origem;

    @Column(name = "referencia_id")
    private String referenciaId;

    @Column(name = "criado_em")
    private String criadoEm;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long pacienteId) { this.pacienteId = pacienteId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Double getCalorias() { return calorias; }
    public void setCalorias(Double calorias) { this.calorias = calorias; }
    public Double getCarboidratos() { return carboidratos; }
    public void setCarboidratos(Double carboidratos) { this.carboidratos = carboidratos; }
    public Double getProteinas() { return proteinas; }
    public void setProteinas(Double proteinas) { this.proteinas = proteinas; }
    public Double getGorduras() { return gorduras; }
    public void setGorduras(Double gorduras) { this.gorduras = gorduras; }
    public String getItens() { return itens; }
    public void setItens(String itens) { this.itens = itens; }
    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }
    public String getReferenciaId() { return referenciaId; }
    public void setReferenciaId(String referenciaId) { this.referenciaId = referenciaId; }
    public String getCriadoEm() { return criadoEm; }
    public void setCriadoEm(String criadoEm) { this.criadoEm = criadoEm; }
}
