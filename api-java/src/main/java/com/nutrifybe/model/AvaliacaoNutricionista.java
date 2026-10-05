package com.nutrifybe.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Feedback enviado pelo paciente ao encerrar um acompanhamento. */
@Entity
@Table(name = "AvaliacoesNutricionista", indexes = {
        @Index(name = "IX_AvaliacoesNutricionista_Nutri", columnList = "nutricionista_id,criado_em")
})
public class AvaliacaoNutricionista {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "paciente_id", nullable = false) private Long pacienteId;
    @Column(name = "nutricionista_id", nullable = false) private Long nutricionistaId;
    @Column(nullable = false) private Integer nota;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String comentario;
    @Column(name = "criado_em", nullable = false) private LocalDateTime criadoEm;

    public Long getId() { return id; }
    public Long getPacienteId() { return pacienteId; }
    public void setPacienteId(Long value) { pacienteId = value; }
    public Long getNutricionistaId() { return nutricionistaId; }
    public void setNutricionistaId(Long value) { nutricionistaId = value; }
    public Integer getNota() { return nota; }
    public void setNota(Integer value) { nota = value; }
    public String getComentario() { return comentario; }
    public void setComentario(String value) { comentario = value; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime value) { criadoEm = value; }
}
