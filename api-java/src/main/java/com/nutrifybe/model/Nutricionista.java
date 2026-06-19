package com.nutrifybe.model;

import jakarta.persistence.*;

@Entity
@Table(name = "Nutricionistas")
public class Nutricionista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String email;
    private String crn;
    private String senha;
    private String status;
    private Integer ativo;
    private String telefone;
    private String especialidade;

    @Column(name = "data_criacao")
    private String dataCriacao;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCrn() { return crn; }
    public void setCrn(String crn) { this.crn = crn; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getAtivo() { return ativo; }
    public void setAtivo(Integer ativo) { this.ativo = ativo; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getEspecialidade() { return especialidade; }
    public void setEspecialidade(String especialidade) { this.especialidade = especialidade; }
    public String getDataCriacao() { return dataCriacao; }
}
