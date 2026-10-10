package com.nutrifybe.controller;

import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.service.MetaCaloriasService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/diario/meta")
public class MetaCaloriasController {
    private final PacienteRepository pacientes;
    private final TokenService tokens;
    private final MetaCaloriasService metas;
    public MetaCaloriasController(PacienteRepository pacientes, TokenService tokens, MetaCaloriasService metas) {
        this.pacientes = pacientes; this.tokens = tokens; this.metas = metas;
    }
    @GetMapping
    public ResponseEntity<?> obter(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        var paciente = pacientes.findById(id).orElse(null);
        if (paciente == null) return erro(404, "Paciente não encontrado");
        return ResponseEntity.ok(metas.obter(paciente));
    }
    @PutMapping
    public ResponseEntity<?> salvar(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        var paciente = pacientes.findById(id).orElse(null);
        if (paciente == null) return erro(404, "Paciente não encontrado");
        if (!metas.obter(paciente).editavel()) return erro(409, "A meta é definida pelo plano alimentar ativo.");
        Double value = Campos.decimal(body.get("calorias"));
        if (value == null || !Double.isFinite(value) || value < 1 || value > 20000 || value != Math.rint(value))
            return erro(400, "Informe uma meta inteira entre 1 e 20.000 kcal.");
        paciente.setMetaCalorias(value.intValue());
        pacientes.save(paciente);
        return ResponseEntity.ok(metas.obter(paciente));
    }
    private ResponseEntity<?> erro(int status, String message) { return ResponseEntity.status(status).body(Map.of("message", message)); }
}
