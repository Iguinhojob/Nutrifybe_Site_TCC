package com.nutrifybe.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "NotificacoesPaciente")
public class NotificacaoPaciente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long pacienteId;
    private String tipo;
    private String titulo;
    private String descricao;
    private String data;
    private boolean lida;

    protected NotificacaoPaciente() {}
    public NotificacaoPaciente(Long pacienteId, String tipo, String titulo, String descricao) {
        this.pacienteId = pacienteId; this.tipo = tipo; this.titulo = titulo;
        this.descricao = descricao; this.data = Instant.now().toString();
    }
    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public String getTipo() { return tipo; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public String getData() { return data; }
    public boolean isLida() { return lida; }
    public void setLida(boolean lida) { this.lida = lida; }
}
