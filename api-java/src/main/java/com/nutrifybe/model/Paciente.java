package com.nutrifybe.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @Column(name = "data_nascimento")
    private String dataNascimento;
    private String sexo;
    private Double peso;
    private Double altura;
    @Column(name = "peso_meta")
    private Double pesoMeta;
    @Column(name = "meta_agua")
    private Double metaAgua;
    private String objetivo;
    private String atividade;
    private String motivacao;
    private String restricoes;
    private String observacoes;
    private String origem;
    @Column(name = "preferencia_acompanhamento")
    private String preferenciaAcompanhamento;

    @Column(name = "condicao_saude")
    private String condicaoSaude;

    @Column(name = "nutricionista_id")
    private Long nutricionistaId;

    private String status;
    private Integer ativo;

    // Senha do paciente (só entra na API, nunca sai nas respostas)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

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
    public String getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(String dataNascimento) { this.dataNascimento = dataNascimento; }
    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }
    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }
    public Double getAltura() { return altura; }
    public void setAltura(Double altura) { this.altura = altura; }
    public Double getPesoMeta() { return pesoMeta; }
    public void setPesoMeta(Double pesoMeta) { this.pesoMeta = pesoMeta; }
    public Double getMetaAgua() { return metaAgua; }
    public void setMetaAgua(Double metaAgua) { this.metaAgua = metaAgua; }
    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }
    public String getAtividade() { return atividade; }
    public void setAtividade(String atividade) { this.atividade = atividade; }
    public String getMotivacao() { return motivacao; }
    public void setMotivacao(String motivacao) { this.motivacao = motivacao; }
    public String getRestricoes() { return restricoes; }
    public void setRestricoes(String restricoes) { this.restricoes = restricoes; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }
    public String getPreferenciaAcompanhamento() { return preferenciaAcompanhamento; }
    public void setPreferenciaAcompanhamento(String preferenciaAcompanhamento) { this.preferenciaAcompanhamento = preferenciaAcompanhamento; }
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
    public void setDataCriacao(String dataCriacao) { this.dataCriacao = dataCriacao; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}
