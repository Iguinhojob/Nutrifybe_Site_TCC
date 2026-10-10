package com.nutrifybe.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrifybe.model.Paciente;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class MetaCaloriasService {
    public record RefeicaoPlanejada(int indice, String nome, String horario) {}
    public record Meta(int calorias, String origem, boolean editavel, List<RefeicaoPlanejada> refeicoes) {}
    private final ObjectMapper json;
    public MetaCaloriasService(ObjectMapper json) { this.json = json; }

    public Meta obter(Paciente paciente) {
        List<RefeicaoPlanejada> meals = new ArrayList<>();
        String prescription = paciente.getPrescricaoSemanal();
        if (prescription != null && !prescription.isBlank()) {
            try {
                JsonNode plan = json.readTree(prescription);
                if (!plan.path("ativo").isBoolean() || plan.path("ativo").asBoolean()) {
                    double total = 0;
                    boolean complete = true;
                    JsonNode items = plan.path("meals");
                    if (items.isArray()) {
                        for (int i = 0; i < items.size(); i++) {
                            JsonNode item = items.get(i);
                            meals.add(new RefeicaoPlanejada(i, item.path("nome").asText("Refeição " + (i + 1)), item.path("horario").asText("")));
                            double kcal = numero(item.path("calorias"));
                            if (!Double.isFinite(kcal) || kcal < 0) complete = false;
                            else total += kcal;
                        }
                    }
                    double explicit = numero(plan.path("metaCalorias"));
                    if (!Double.isFinite(explicit) || explicit <= 0) explicit = numero(plan.path("caloriasDiarias"));
                    double goal = Double.isFinite(explicit) && explicit > 0 ? explicit : complete && !meals.isEmpty() ? total : 0;
                    if (goal > 0 && goal <= 20000) return new Meta((int) Math.round(goal), "plano", false, meals);
                }
            } catch (Exception ignored) {
                // Prescriptions stored as free text have no structured calorie goal.
            }
        }
        if (meals.isEmpty()) meals = List.of(new RefeicaoPlanejada(0, "Café da manhã", "08:00"),
                new RefeicaoPlanejada(1, "Almoço", "12:00"), new RefeicaoPlanejada(2, "Lanche", "16:00"),
                new RefeicaoPlanejada(3, "Jantar", "19:00"));
        Integer saved = paciente.getMetaCalorias();
        return new Meta(saved != null && saved > 0 ? saved : 2000, saved != null && saved > 0 ? "pessoal" : "padrao", true, meals);
    }

    private static double numero(JsonNode value) {
        try { return Double.parseDouble(value.asText().trim().replace(',', '.')); }
        catch (Exception ignored) { return Double.NaN; }
    }
}
