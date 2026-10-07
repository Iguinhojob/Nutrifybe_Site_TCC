package com.nutrifybe.controller;

import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.AvaliacaoNutricionista;
import com.nutrifybe.repository.AvaliacaoNutricionistaRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.security.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/nutricionistas")
public class NutricionistasController {

    private final NutricionistaRepository repository;
    private final AvaliacaoNutricionistaRepository avaliacaoRepository;
    private final TokenService tokens;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public NutricionistasController(NutricionistaRepository repository, AvaliacaoNutricionistaRepository avaliacaoRepository, TokenService tokens) {
        this.repository = repository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.tokens = tokens;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return repository.findAll().stream().map(this::publico).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(n -> ResponseEntity.ok((Object) publico(n)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/avaliacoes")
    public ResponseEntity<?> getAvaliacoes(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        List<AvaliacaoNutricionista> avaliacoes = avaliacaoRepository.findTop100ByNutricionistaIdOrderByCriadoEmDesc(id);
        List<Map<String, Object>> publicas = avaliacoes.stream().map(avaliacao -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nota", avaliacao.getNota());
            item.put("comentario", avaliacao.getComentario());
            item.put("criadoEm", avaliacao.getCriadoEm());
            return item;
        }).toList();
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("media", avaliacaoRepository.averageNota(id));
        resultado.put("total", avaliacaoRepository.countByNutricionistaId(id));
        resultado.put("avaliacoes", publicas);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Nutricionista nutricionista) {
        nutricionista.setSenha(passwordEncoder.encode(nutricionista.getSenha()));
        repository.save(nutricionista);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String crn = body.get("crn");
        String senha = body.get("senha");

        Optional<Nutricionista> nutri = repository.findByEmailAndCrnAndStatusAndAtivo(email, crn, "approved", 1);

        if (nutri.isPresent() && passwordEncoder.matches(senha, nutri.get().getSenha())) {
            Nutricionista profissional = nutri.get();
            return ResponseEntity.ok(Map.of("success", true, "nutricionista", publico(profissional),
                    "token", tokens.gerarNutricionista(profissional.getId())));
        }
        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Credenciais inválidas"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(nutri -> {
            if (body.containsKey("status")) nutri.setStatus((String) body.get("status"));
            if (body.containsKey("ativo")) nutri.setAtivo((Integer) body.get("ativo"));
            if (body.containsKey("nome")) nutri.setNome((String) body.get("nome"));
            if (body.containsKey("email")) nutri.setEmail((String) body.get("email"));
            if (body.containsKey("telefone")) nutri.setTelefone((String) body.get("telefone"));
            if (body.containsKey("especialidade")) nutri.setEspecialidade((String) body.get("especialidade"));
            if (body.containsKey("descricao")) nutri.setDescricao((String) body.get("descricao"));
            if (body.containsKey("foto")) nutri.setFoto((String) body.get("foto"));
            if (body.containsKey("senha")) nutri.setSenha(passwordEncoder.encode((String) body.get("senha")));
            repository.save(nutri);
            return ResponseEntity.ok(publico(nutri));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Map<String, Object> publico(Nutricionista n) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("id", n.getId());
        dados.put("nome", n.getNome());
        dados.put("email", n.getEmail());
        dados.put("crn", n.getCrn());
        dados.put("status", n.getStatus());
        dados.put("ativo", n.getAtivo());
        dados.put("telefone", n.getTelefone());
        dados.put("especialidade", n.getEspecialidade());
        dados.put("descricao", n.getDescricao());
        dados.put("foto", n.getFoto());
        dados.put("dataCriacao", n.getDataCriacao());
        return dados;
    }
}
