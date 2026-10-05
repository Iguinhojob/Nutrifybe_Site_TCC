package com.nutrifybe.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ChatMensagens", indexes = {
        @Index(name = "IX_ChatMensagens_Conversa", columnList = "paciente_id,nutricionista_id,id")
})
public class ChatMensagem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "paciente_id", nullable = false) private Long pacienteId;
    @Column(name = "nutricionista_id", nullable = false) private Long nutricionistaId;
    @Column(name = "remetente_tipo", nullable = false, length = 20) private String remetenteTipo;
    @Column(name = "remetente_id", nullable = false) private Long remetenteId;
    @Column(name = "remetente_nome", nullable = false, length = 160) private String remetenteNome;
    @Column(name = "texto", columnDefinition = "NVARCHAR(MAX)") private String texto;
    @Column(name = "criado_em", nullable = false) private LocalDateTime criadoEm;
    @Column(name = "lido_em") private LocalDateTime lidoEm;
    @Column(name = "arquivo_nome", length = 255) private String arquivoNome;
    @Column(name = "arquivo_tipo", length = 100) private String arquivoTipo;
    @Column(name = "arquivo_tamanho") private Long arquivoTamanho;
    @Lob @Column(name = "arquivo_dados", columnDefinition = "VARBINARY(MAX)") private byte[] arquivoDados;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long value) { pacienteId = value; }
    public Long getNutricionistaId() { return nutricionistaId; }
    public void setNutricionistaId(Long value) { nutricionistaId = value; }
    public String getRemetenteTipo() { return remetenteTipo; }
    public void setRemetenteTipo(String value) { remetenteTipo = value; }
    public Long getRemetenteId() { return remetenteId; }
    public void setRemetenteId(Long value) { remetenteId = value; }
    public String getRemetenteNome() { return remetenteNome; }
    public void setRemetenteNome(String value) { remetenteNome = value; }
    public String getTexto() { return texto; }
    public void setTexto(String value) { texto = value; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime value) { criadoEm = value; }
    public LocalDateTime getLidoEm() { return lidoEm; }
    public void setLidoEm(LocalDateTime value) { lidoEm = value; }
    public String getArquivoNome() { return arquivoNome; }
    public void setArquivoNome(String value) { arquivoNome = value; }
    public String getArquivoTipo() { return arquivoTipo; }
    public void setArquivoTipo(String value) { arquivoTipo = value; }
    public Long getArquivoTamanho() { return arquivoTamanho; }
    public void setArquivoTamanho(Long value) { arquivoTamanho = value; }
    public byte[] getArquivoDados() { return arquivoDados; }
    public void setArquivoDados(byte[] value) { arquivoDados = value; }
}
