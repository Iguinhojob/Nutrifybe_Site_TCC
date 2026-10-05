package com.nutrifybe.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class FoodSearchService {
    private static final String FDC_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
    private final RestClient client = RestClient.create();
    private final String apiKey;

    public FoodSearchService(@Value("${app.food-data-central.api-key:DEMO_KEY}") String apiKey) {
        this.apiKey = apiKey;
    }

    public List<FoodResult> search(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < 2 || query.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A busca deve ter entre 2 e 100 caracteres.");
        }
        var uri = UriComponentsBuilder.fromUriString(FDC_SEARCH_URL)
                .queryParam("query", query)
                .queryParam("dataType", "Foundation,SR Legacy,Survey (FNDDS)")
                .queryParam("pageSize", 20)
                .queryParam("api_key", apiKey)
                .build().encode().toUri();
        try {
            JsonNode response = client.get().uri(uri).retrieve().body(JsonNode.class);
            JsonNode foods = response == null ? null : response.path("foods");
            if (foods == null || !foods.isArray()) return List.of();
            List<FoodResult> results = new ArrayList<>();
            for (JsonNode food : foods) {
                String description = text(food, "description");
                BigDecimal calories = nutrient(food, "energy");
                if (description.isBlank() || calories == null || calories.signum() < 0) continue;
                results.add(new FoodResult(text(food, "fdcId"), description, text(food, "dataType"),
                        firstText(food, "brandName", "brandOwner"), calories,
                        nutrient(food, "carbohydrate"), nutrient(food, "protein"), nutrient(food, "total lipid"),
                        "USDA FoodData Central"));
            }
            return results;
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "A cota de consultas da base de alimentos foi atingida. Configure uma chave própria da FoodData Central.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A base de alimentos rejeitou a busca (HTTP " + e.getStatusCode().value() + "). Confira a configuração do backend.");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "A base de alimentos está temporariamente indisponível. Tente novamente.");
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? "" : value.asText("");
    }

    private static String firstText(JsonNode node, String first, String second) {
        String value = text(node, first);
        return value.isBlank() ? text(node, second) : value;
    }

    private static BigDecimal nutrient(JsonNode food, String namePart) {
        JsonNode values = food.path("foodNutrients");
        if (!values.isArray()) return null;
        for (JsonNode item : values) {
            String name = text(item, "nutrientName").toLowerCase(Locale.ROOT);
            if (!name.contains(namePart)) continue;
            JsonNode raw = item.get("value");
            if (raw == null || !raw.isNumber()) continue;
            BigDecimal amount = raw.decimalValue();
            String unit = text(item, "unitName");
            if (namePart.equals("energy") && unit.equalsIgnoreCase("kJ")) {
                amount = amount.divide(new BigDecimal("4.184"), 2, RoundingMode.HALF_UP);
            } else if (namePart.equals("energy") && !unit.equalsIgnoreCase("kcal")) {
                continue;
            }
            return amount;
        }
        return null;
    }

    public record FoodResult(String foodId, String description, String dataType, String brandName,
            BigDecimal caloriesPer100g, BigDecimal carbsPer100g, BigDecimal proteinPer100g,
            BigDecimal fatPer100g, String source) {}
}
