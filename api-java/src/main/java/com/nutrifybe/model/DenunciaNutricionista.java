package com.nutrifybe.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Denuncia enviada por um paciente ao encerrar o acompanhamento. */
@Entity
@Table(name = "DenunciasNutricionista", indexes = {
        @Index(name = "IX_DenunciasNutricionista_Nutri", columnList = "nutricionista_id,criado_em")
})
public class DenunciaNutricionista {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "paciente_id", nullable = false) private Long pacienteId;
    @Column(name = "nutricionista_id", nullable = false) private Long nutricionistaId;
    @Column(nullable = false, columnDefinition = "NVARCHAR(2000)") private String descricao;
    @Column(name = "criado_em", nullable = false) private LocalDateTime criadoEm;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long value) { pacienteId = value; }
    public Long getNutricionistaId() { return nutricionistaId; }
    public void setNutricionistaId(Long value) { nutricionistaId = value; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String value) { descricao = value; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime value) { criadoEm = value; }
}
