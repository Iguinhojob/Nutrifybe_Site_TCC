package com.nutrifybe.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import java.util.Map;

/** Display names; the source data and stored nutrition snapshots are preserved. */
public final class NomesAlimentos {
    private static final Map<String, String> NOMES = carregar();
    private NomesAlimentos() {}

    private static Map<String, String> carregar() {
        try (var stream = new ClassPathResource("taco_nomes.json").getInputStream()) {
            return new ObjectMapper().readValue(stream, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Não foi possível carregar os nomes dos alimentos", e);
        }
    }

    public static String exibir(String original) {
        return original == null ? "" : NOMES.getOrDefault(original.trim(), original);
    }
}
