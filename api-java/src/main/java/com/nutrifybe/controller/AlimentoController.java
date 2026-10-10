package com.nutrifybe.controller;

import com.nutrifybe.model.Alimento;
import com.nutrifybe.repository.AlimentoRepository;
import com.nutrifybe.service.NomesAlimentos;
import org.springframework.web.bind.annotation.*;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;

@RestController
public class AlimentoController {
    private final AlimentoRepository alimentos;
    public AlimentoController(AlimentoRepository alimentos) { this.alimentos = alimentos; }

    @GetMapping({"/alimentos", "/api/alimentos"})
    public List<Map<String, Object>> buscar(@RequestParam(defaultValue = "") String busca,
                                            @RequestParam(required = false) String query) {
        String termo = busca.isBlank() && query != null ? query : busca;
        if (termo.isBlank()) return List.of();
        String normalizado = normalizar(termo);
        return alimentos.findAll().stream().filter(a -> {
                    String nomes = normalizar(a.getNome() + " " + NomesAlimentos.exibir(a.getNome()));
                    return java.util.Arrays.stream(normalizado.split("\\s+")).allMatch(nomes::contains);
                })
                .sorted(java.util.Comparator.comparing(Alimento::getNome, String.CASE_INSENSITIVE_ORDER))
                .limit(20).map(AlimentoController::dto).toList();
    }
    private static String normalizar(String texto) { return Normalizer.normalize(texto.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}+", "").toLowerCase(java.util.Locale.ROOT); }
    private static Map<String, Object> dto(Alimento a) {
        return Map.ofEntries(Map.entry("alimentoId", a.getId()), Map.entry("foodId", String.valueOf(a.getId())),
                Map.entry("nome", NomesAlimentos.exibir(a.getNome())), Map.entry("description", NomesAlimentos.exibir(a.getNome())), Map.entry("nomeOriginal", a.getNome()), Map.entry("categoria", a.getCategoria() == null ? "" : a.getCategoria()),
                Map.entry("kcal_100g", a.getKcal100g()), Map.entry("proteina_100g", a.getProteina100g()),
                Map.entry("gordura_100g", a.getGordura100g()), Map.entry("carboidrato_100g", a.getCarboidrato100g()),
                Map.entry("fibra_100g", a.getFibra100g()), Map.entry("caloriesPer100g", a.getKcal100g()),
                Map.entry("proteinPer100g", a.getProteina100g()), Map.entry("fatPer100g", a.getGordura100g()),
                Map.entry("carbsPer100g", a.getCarboidrato100g()), Map.entry("fiberPer100g", a.getFibra100g()),
                Map.entry("source", "TACO 4ª edição, NEPA/UNICAMP"), Map.entry("dataType", "TACO"), Map.entry("brandName", ""));
    }
}
