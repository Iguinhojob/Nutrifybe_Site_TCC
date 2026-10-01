package com.nutrifybe.controller;

import com.nutrifybe.model.DiarioAgua;
import com.nutrifybe.model.DiarioMedida;
import com.nutrifybe.model.DiarioRefeicao;
import com.nutrifybe.repository.DiarioAguaRepository;
import com.nutrifybe.repository.DiarioMedidaRepository;
import com.nutrifybe.repository.DiarioRefeicaoRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

/** Diário do paciente (refeições, água e medidas). Todas as rotas exigem o token de login. */
@RestController
@RequestMapping("/api/diario")
public class DiarioController {

    private final DiarioRefeicaoRepository refeicoes;
    private final DiarioAguaRepository agua;
    private final DiarioMedidaRepository medidas;
    private final TokenService tokens;

    public DiarioController(DiarioRefeicaoRepository refeicoes, DiarioAguaRepository agua,
                            DiarioMedidaRepository medidas, TokenService tokens) {
        this.refeicoes = refeicoes;
        this.agua = agua;
        this.medidas = medidas;
        this.tokens = tokens;
    }

    // ---------- Refeições ----------
    @GetMapping("/refeicoes")
    public ResponseEntity<?> listarRefeicoes(@RequestHeader(value = "Authorization", required = false) String auth,
                                             @RequestParam(required = false) String date) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        List<DiarioRefeicao> registros = refeicoes.findByPacienteIdOrderByCriadoEmDesc(id);
        if (date != null && !date.isBlank()) registros = registros.stream().filter(r -> r.getCriadoEm() != null && r.getCriadoEm().startsWith(date)).collect(Collectors.toList());
        return ResponseEntity.ok(registros);
    }

    @PostMapping("/refeicoes")
    public ResponseEntity<?> criarRefeicao(@RequestHeader(value = "Authorization", required = false) String auth,
                                           @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        Double calorias = Campos.decimal(body.containsKey("calorias") ? body.get("calorias") : body.get("calories"));
        String referenciaId = Campos.texto(body.get("referenciaId"));
        if (referenciaId != null) {
            var existente = refeicoes.findFirstByPacienteIdAndReferenciaId(id, referenciaId);
            if (existente.isPresent()) return ResponseEntity.ok(existente.get());
        }
        if (calorias == null || calorias < 0) return erro(400, "Informe as calorias da refeição");

        DiarioRefeicao r = new DiarioRefeicao();
        r.setPacienteId(id);
        r.setNome(primeiroTexto(body, "nome", "mealType") != null ? primeiroTexto(body, "nome", "mealType") : "Refeição");
        r.setDescricao(primeiroTexto(body, "descricao", "description"));
        r.setCalorias(calorias);
        r.setCarboidratos(Campos.decimal(body.containsKey("carboidratos") ? body.get("carboidratos") : body.get("carbs")));
        r.setProteinas(Campos.decimal(body.containsKey("proteinas") ? body.get("proteinas") : body.get("protein")));
        r.setGorduras(Campos.decimal(body.containsKey("gorduras") ? body.get("gorduras") : body.get("fat")));
        r.setItens(Campos.texto(body.get("itens")));
        r.setOrigem(Campos.texto(body.get("origem")));
        r.setReferenciaId(Campos.texto(body.get("referenciaId")));
        r.setCriadoEm(Campos.dataOuAgora(body.containsKey("criadoEm") ? body.get("criadoEm") : body.get("entryDate")));
        return ResponseEntity.ok(refeicoes.save(r));
    }

    @PutMapping("/refeicoes/{registroId}")
    public ResponseEntity<?> atualizarRefeicao(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @PathVariable Long registroId,
                                                @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        Double calorias = Campos.decimal(body.containsKey("calorias") ? body.get("calorias") : body.get("calories"));
        if (calorias == null || calorias < 0) return erro(400, "Informe calorias validas para a refeicao");
        return refeicoes.findByIdAndPacienteId(registroId, id).map(r -> {
            String nome = primeiroTexto(body, "nome", "mealType");
            if (nome != null) r.setNome(nome);
            if (body.containsKey("descricao") || body.containsKey("description")) r.setDescricao(primeiroTexto(body, "descricao", "description"));
            r.setCalorias(calorias);
            if (body.containsKey("carboidratos") || body.containsKey("carbs")) r.setCarboidratos(Campos.decimal(body.containsKey("carboidratos") ? body.get("carboidratos") : body.get("carbs")));
            if (body.containsKey("proteinas") || body.containsKey("protein")) r.setProteinas(Campos.decimal(body.containsKey("proteinas") ? body.get("proteinas") : body.get("protein")));
            if (body.containsKey("gorduras") || body.containsKey("fat")) r.setGorduras(Campos.decimal(body.containsKey("gorduras") ? body.get("gorduras") : body.get("fat")));
            if (body.containsKey("itens") || body.containsKey("items")) r.setItens(Campos.texto(body.containsKey("itens") ? body.get("itens") : body.get("items")));
            return ResponseEntity.ok(refeicoes.save(r));
        }).orElseGet(() -> ResponseEntity.status(404).body((Object) Map.of("success", false, "message", "Registro nao encontrado")));
    }

    @DeleteMapping("/refeicoes/{registroId}")
    public ResponseEntity<?> apagarRefeicao(@RequestHeader(value = "Authorization", required = false) String auth,
                                            @PathVariable Long registroId) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return refeicoes.findByIdAndPacienteId(registroId, id).map(r -> {
            refeicoes.delete(r);
            return ResponseEntity.ok((Object) Map.of("success", true));
        }).orElseGet(() -> ResponseEntity.status(404).body((Object) Map.of("success", false, "message", "Não encontrado")));
    }

    // ---------- Água ----------
    @GetMapping("/agua")
    public ResponseEntity<?> listarAgua(@RequestHeader(value = "Authorization", required = false) String auth,
                                        @RequestParam(required = false) String date) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        List<DiarioAgua> registros = agua.findByPacienteIdOrderByCriadoEmDesc(id);
        if (date != null && !date.isBlank()) registros = registros.stream().filter(r -> r.getCriadoEm() != null && r.getCriadoEm().startsWith(date)).collect(Collectors.toList());
        return ResponseEntity.ok(registros);
    }

    @PostMapping("/agua")
    public ResponseEntity<?> criarAgua(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        Integer ml = Campos.inteiro(body.containsKey("quantidadeMl") ? body.get("quantidadeMl") : body.get("amountMl"));
        if (ml == null || ml <= 0) return erro(400, "Informe a quantidade de água em ml");
        String referenciaId = Campos.texto(body.get("referenciaId"));
        if (referenciaId != null) {
            var existente = agua.findFirstByPacienteIdAndReferenciaId(id, referenciaId);
            if (existente.isPresent()) return ResponseEntity.ok(existente.get());
        }

        DiarioAgua a = new DiarioAgua();
        a.setPacienteId(id);
        a.setQuantidadeMl(ml);
        a.setReferenciaId(referenciaId);
        a.setCriadoEm(Campos.dataOuAgora(body.containsKey("criadoEm") ? body.get("criadoEm") : body.get("entryDate")));
        return ResponseEntity.ok(agua.save(a));
    }

    @DeleteMapping("/agua/{registroId}")
    public ResponseEntity<?> apagarAgua(@RequestHeader(value = "Authorization", required = false) String auth,
                                        @PathVariable Long registroId) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return agua.findByIdAndPacienteId(registroId, id).map(a -> {
            agua.delete(a);
            return ResponseEntity.ok((Object) Map.of("success", true));
        }).orElseGet(() -> ResponseEntity.status(404).body((Object) Map.of("success", false, "message", "Não encontrado")));
    }

    // ---------- Medidas ----------
    @GetMapping("/medidas")
    public ResponseEntity<?> listarMedidas(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return ResponseEntity.ok(medidas.findByPacienteIdOrderByCriadoEmDesc(id));
    }

    @PostMapping("/medidas")
    public ResponseEntity<?> criarMedida(@RequestHeader(value = "Authorization", required = false) String auth,
                                         @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();

        DiarioMedida m = new DiarioMedida();
        m.setPacienteId(id);
        m.setPeso(Campos.texto(body.get("peso")));
        m.setCintura(Campos.texto(body.get("cintura")));
        m.setQuadril(Campos.texto(body.get("quadril")));
        m.setBraco(Campos.texto(body.get("braco")));
        m.setGorduraCorporal(Campos.texto(body.get("gorduraCorporal")));
        if (m.getPeso() == null && m.getCintura() == null && m.getQuadril() == null
                && m.getBraco() == null && m.getGorduraCorporal() == null) {
            return erro(400, "Informe pelo menos uma medida");
        }
        String referenciaId = Campos.texto(body.get("referenciaId"));
        if (referenciaId != null) {
            var existente = medidas.findFirstByPacienteIdAndReferenciaId(id, referenciaId);
            if (existente.isPresent()) return ResponseEntity.ok(existente.get());
        }
        m.setReferenciaId(referenciaId);
        m.setCriadoEm(Campos.dataOuAgora(body.get("criadoEm")));
        return ResponseEntity.ok(medidas.save(m));
    }

    @DeleteMapping("/medidas/{registroId}")
    public ResponseEntity<?> apagarMedida(@RequestHeader(value = "Authorization", required = false) String auth,
                                          @PathVariable Long registroId) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return medidas.findByIdAndPacienteId(registroId, id).map(m -> {
            medidas.delete(m);
            return ResponseEntity.ok((Object) Map.of("success", true));
        }).orElseGet(() -> ResponseEntity.status(404).body((Object) Map.of("success", false, "message", "Não encontrado")));
    }

    private ResponseEntity<?> naoAutorizado() {
        return erro(401, "Sessão inválida");
    }

    private ResponseEntity<?> erro(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", mensagem));
    }

    private static String primeiroTexto(Map<String, Object> body, String... nomes) {
        for (String nome : nomes) {
            String valor = Campos.texto(body.get(nome));
            if (valor != null) return valor;
        }
        return null;
    }
}
