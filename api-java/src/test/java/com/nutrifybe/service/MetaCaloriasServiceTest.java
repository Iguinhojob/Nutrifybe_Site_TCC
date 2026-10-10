package com.nutrifybe.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrifybe.model.Paciente;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MetaCaloriasServiceTest {
    private final MetaCaloriasService service = new MetaCaloriasService(new ObjectMapper());
    @Test void defaultIsEditableAndHasFourPlannedMeals() {
        var meta = service.obter(new Paciente());
        assertEquals(2000, meta.calorias()); assertTrue(meta.editavel()); assertEquals(4, meta.refeicoes().size());
    }
    @Test void prescriptionTakesPriorityOverPersonalGoal() {
        var p = new Paciente(); p.setMetaCalorias(1800);
        p.setPrescricaoSemanal("{\"version\":1,\"meals\":[{\"nome\":\"Café\",\"calorias\":500},{\"nome\":\"Almoço\",\"calorias\":\"750,5\"}]}");
        var meta = service.obter(p);
        assertEquals(1251, meta.calorias()); assertEquals("plano", meta.origem()); assertFalse(meta.editavel());
    }
    @Test void soloStructuredPlanSupportsAnExplicitGoal() {
        var p = new Paciente(); p.setPrescricaoSemanal("{\"metaCalorias\":2100,\"meals\":[{\"nome\":\"Almoço\"}]}");
        assertEquals(2100, service.obter(p).calorias()); assertEquals("plano", service.obter(p).origem());
    }
    @Test void incompleteOrInactivePrescriptionDoesNotCreateAPartialGoal() {
        var p = new Paciente(); p.setMetaCalorias(1900);
        p.setPrescricaoSemanal("{\"meals\":[{\"calorias\":400},{\"calorias\":\"\"}]}");
        assertEquals(1900, service.obter(p).calorias()); assertTrue(service.obter(p).editavel());
        p.setPrescricaoSemanal("{\"ativo\":false,\"metaCalorias\":2500}");
        assertEquals(1900, service.obter(p).calorias());
        p.setPrescricaoSemanal("Prescrição antiga em texto");
        assertEquals("pessoal", service.obter(p).origem());
    }
}
