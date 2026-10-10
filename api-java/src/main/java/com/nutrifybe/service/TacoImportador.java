package com.nutrifybe.service;

import com.nutrifybe.model.Alimento;
import com.nutrifybe.repository.AlimentoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
public class TacoImportador implements CommandLineRunner {
    private final AlimentoRepository alimentos;
    public TacoImportador(AlimentoRepository alimentos) { this.alimentos = alimentos; }

    @Override @Transactional
    public void run(String... args) throws Exception {
        if (alimentos.count() != 0) return;
        try (var reader = new BufferedReader(new InputStreamReader(new ClassPathResource("taco_alimentos.csv").getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine();
            String line;
            while ((line = reader.readLine()) != null) {
                var columns = csv(line);
                if (columns.size() != 8) continue;
                Alimento a = new Alimento();
                a.setId(Long.parseLong(columns.get(0)));
                a.setNome(columns.get(1)); a.setCategoria(columns.get(2));
                a.setKcal100g(number(columns.get(3))); a.setProteina100g(number(columns.get(4)));
                a.setGordura100g(number(columns.get(5))); a.setCarboidrato100g(number(columns.get(6)));
                a.setFibra100g(number(columns.get(7)));
                alimentos.save(a);
            }
        }
    }
    private static double number(String value) { return Double.parseDouble(value.trim().replace(',', '.')); }
    private static java.util.List<String> csv(String line) {
        var values = new java.util.ArrayList<String>(); var value = new StringBuilder(); boolean quoted = false;
        for (int i = 0; i < line.length(); i++) { char c = line.charAt(i);
            if (c == '"') { if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') { value.append('"'); i++; } else quoted = !quoted; }
            else if (c == ',' && !quoted) { values.add(value.toString()); value.setLength(0); } else value.append(c);
        }
        values.add(value.toString()); return values;
    }
}
