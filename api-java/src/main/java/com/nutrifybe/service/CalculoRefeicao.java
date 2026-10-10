package com.nutrifybe.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.nutrifybe.model.Alimento;
import com.nutrifybe.repository.AlimentoRepository;
import org.springframework.stereotype.Service;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CalculoRefeicao {
    public record Totais(String itens, Double calorias, Double carboidratos, Double proteinas, Double gorduras, Double fibras) {}
    private final AlimentoRepository alimentos;
    private final ObjectMapper json;
    public CalculoRefeicao(AlimentoRepository alimentos, ObjectMapper json) { this.alimentos = alimentos; this.json = json; }

    public Totais calcular(Object recebido, Double kcalInformada, Double carbInformado, Double protInformada, Double gorduraInformada, Double fibraInformada) {
        try {
            JsonNode source = recebido == null ? json.createArrayNode() : recebido instanceof String s ? json.readTree(s) : json.valueToTree(recebido);
            if (!source.isArray()) throw new IllegalArgumentException("Lista de alimentos inválida");
            ArrayNode resultado = json.createArrayNode();
            double kcal = 0, carb = 0, prot = 0, gordura = 0, fibra = 0;
            boolean calculado = false;
            for (JsonNode node : source) {
                if (!node.isObject()) continue;
                ObjectNode item = (ObjectNode) node.deepCopy();
                if (item.hasNonNull("alimentoId")) {
                    long id = item.path("alimentoId").asLong(-1);
                    double gramas = item.path("gramas").asDouble(-1);
                    if (id < 1 || !Double.isFinite(gramas) || gramas <= 0) throw new IllegalArgumentException("Informe um alimento e uma quantidade em gramas válida");
                    Alimento a = alimentos.findById(id).orElseThrow(() -> new IllegalArgumentException("Alimento TACO não encontrado"));
                    double factor = gramas / 100d;
                    kcal = add(item, "calorias", kcal, a.getKcal100g() * factor, 0);
                    carb = add(item, "carboidratos", carb, a.getCarboidrato100g() * factor, 1);
                    prot = add(item, "proteinas", prot, a.getProteina100g() * factor, 1);
                    gordura = add(item, "gorduras", gordura, a.getGordura100g() * factor, 1);
                    fibra = add(item, "fibras", fibra, a.getFibra100g() * factor, 1);
                    item.put("nome", NomesAlimentos.exibir(a.getNome())); item.put("name", NomesAlimentos.exibir(a.getNome()));
                    item.put("quantity", gramas); item.put("foodId", String.valueOf(a.getId()));
                    item.put("grams", gramas); item.put("portionLabel", "g");
                    item.put("fonte", "TACO 4ª edição, NEPA/UNICAMP");
                    item.put("dataSource", "TACO 4ª edição, NEPA/UNICAMP");
                    item.put("calorias_100g", a.getKcal100g()); item.put("carboidratos_100g", a.getCarboidrato100g());
                    item.put("proteinas_100g", a.getProteina100g()); item.put("gorduras_100g", a.getGordura100g()); item.put("fibras_100g", a.getFibra100g());
                    item.put("caloriesPer100g", a.getKcal100g()); item.put("carbsPer100g", a.getCarboidrato100g());
                    item.put("proteinPer100g", a.getProteina100g()); item.put("fatPer100g", a.getGordura100g()); item.put("fiberPer100g", a.getFibra100g());
                    calculado = true;
                } else if (calculado || source.size() > 1) {
                    kcal += item.path("calorias").asDouble(item.path("calories").asDouble(0));
                    carb += item.path("carboidratos").asDouble(item.path("carbs").asDouble(0));
                    prot += item.path("proteinas").asDouble(item.path("protein").asDouble(0));
                    gordura += item.path("gorduras").asDouble(item.path("fat").asDouble(0));
                    fibra += item.path("fibras").asDouble(item.path("fiber").asDouble(0));
                }
                resultado.add(item);
            }
            if (!calculado) return new Totais(json.writeValueAsString(resultado), kcalInformada, carbInformado, protInformada, gorduraInformada, fibraInformada);
            for (JsonNode node : resultado) if (!node.hasNonNull("alimentoId")) {
                kcal += 0; // Older item values remain as stored; nutrition totals for new TACO meals are server-derived.
            }
            return new Totais(json.writeValueAsString(resultado), kcal, carb, prot, gordura, fibra);
        } catch (IllegalArgumentException e) { throw e; }
        catch (Exception e) { throw new IllegalArgumentException("Itens da refeição inválidos"); }
    }
    private static double add(ObjectNode item, String key, double sum, double value, int decimals) {
        value = arredondar(value, decimals);
        item.put(key, value);
        String alias = switch (key) { case "calorias" -> "calories"; case "carboidratos" -> "carbs"; case "proteinas" -> "protein"; case "gorduras" -> "fat"; default -> "fiber"; };
        item.put(alias, value);
        return sum + value;
    }
    private static double arredondar(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round((value + Math.ulp(value)) * factor) / factor;
    }
}
