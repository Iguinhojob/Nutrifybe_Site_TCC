package com.nutrifybe.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.service.FoodSearchService;

@RestController
@RequestMapping("/api/alimentos")
public class FoodSearchController {
    private final FoodSearchService foods;
    private final TokenService tokens;

    public FoodSearchController(FoodSearchService foods, TokenService tokens) {
        this.foods = foods;
        this.tokens = tokens;
    }

    @GetMapping("/busca")
    public ResponseEntity<?> search(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestParam String query) {
        if (tokens.validar(auth) == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Sessão inválida"));
        }
        List<FoodSearchService.FoodResult> results = foods.search(query);
        return ResponseEntity.ok(results);
    }
}
