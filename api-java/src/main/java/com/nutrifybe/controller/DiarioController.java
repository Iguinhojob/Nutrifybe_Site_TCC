package com.nutrifybe.controller;

import com.nutrifybe.model.DiarioAgua;
import com.nutrifybe.model.DiarioMedida;
import com.nutrifybe.model.DiarioRefeicao;
import com.nutrifybe.repository.DiarioAguaRepository;
import com.nutrifybe.repository.DiarioMedidaRepository;
import com.nutrifybe.repository.DiarioRefeicaoRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.service.CalculoRefeicao;
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
    private final CalculoRefeicao calculo;

    public DiarioController(DiarioRefeicaoRepository refeicoes, DiarioAguaRepository agua,
                            DiarioMedidaRepository medidas, TokenService tokens, CalculoRefeicao calculo) {
        this.refeicoes = refeicoes;
        this.agua = agua;
        this.medidas = medidas;
        this.tokens = tokens;
        this.calculo = calculo;
    }

    // ---------- Refeições ----------
    @GetMapping("/refeicoes")
    public ResponseEntity<?> listarRefeicoes(@RequestHeader(value = "Authorization", required = false) String auth,
                                             @RequestParam(required = false) String date) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        List<DiarioRefeicao> registros = refeicoes.findByPacienteIdOrderByCriadoEmDesc(id);
        if (date != null && !date.isBlank()) registros = registros.stream().filter(r -> date.equals(r.getEntryDate())).collect(Collectors.toList());
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
        CalculoRefeicao.Totais totais;
        try { totais = calcular(body); } catch (IllegalArgumentException e) { return erro(400, e.getMessage()); }
        if (totais.calorias() == null || totais.calorias() < 0) return erro(400, "Informe calorias válidas para a refeição");

        DiarioRefeicao r = new DiarioRefeicao();
        r.setPacienteId(id);
        r.setNome(primeiroTexto(body, "nome", "mealType") != null ? primeiroTexto(body, "nome", "mealType") : "Refeição");
        r.setDescricao(primeiroTexto(body, "descricao", "description"));
        aplicarTotais(r, totais);
        r.setOrigem(Campos.texto(body.get("origem")));
        r.setReferenciaId(Campos.texto(body.get("referenciaId")));
        r.setCriadoEm(Campos.dataOuAgora(body.containsKey("criadoEm") ? body.get("criadoEm") : body.get("entryDate")));
        String entryDate = Campos.texto(body.get("entryDate"));
        if (entryDate != null && entryDate.matches("\\d{4}-\\d{2}-\\d{2}")) {
            try { r.setEntryDate(java.time.LocalDate.parse(entryDate).toString()); }
            catch (java.time.format.DateTimeParseException e) { return erro(400, "Data do diário inválida"); }
        }
        return ResponseEntity.ok(refeicoes.save(r));
    }

    @PutMapping("/refeicoes/{registroId}")
    public ResponseEntity<?> atualizarRefeicao(@RequestHeader(value = "Authorization", required = false) String auth,
                                                @PathVariable Long registroId,
                                                @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        DiarioRefeicao r = refeicoes.findByIdAndPacienteId(registroId, id).orElse(null);
        if (r == null) return ResponseEntity.status(404).body(Map.of("success", false, "message", "Registro nao encontrado"));
        CalculoRefeicao.Totais totais;
        try {
            if (!body.containsKey("itens") && !body.containsKey("items")) {
                totais = new CalculoRefeicao.Totais(r.getItens(),
                        Campos.decimal(body.containsKey("calorias") ? body.get("calorias") : body.get("calories")) != null ? Campos.decimal(body.containsKey("calorias") ? body.get("calorias") : body.get("calories")) : r.getCalorias(),
                        Campos.decimal(body.containsKey("carboidratos") ? body.get("carboidratos") : body.get("carbs")) != null ? Campos.decimal(body.containsKey("carboidratos") ? body.get("carboidratos") : body.get("carbs")) : r.getCarboidratos(),
                        Campos.decimal(body.containsKey("proteinas") ? body.get("proteinas") : body.get("protein")) != null ? Campos.decimal(body.containsKey("proteinas") ? body.get("proteinas") : body.get("protein")) : r.getProteinas(),
                        Campos.decimal(body.containsKey("gorduras") ? body.get("gorduras") : body.get("fat")) != null ? Campos.decimal(body.containsKey("gorduras") ? body.get("gorduras") : body.get("fat")) : r.getGorduras(),
                        Campos.decimal(body.containsKey("fibras") ? body.get("fibras") : body.get("fiber")) != null ? Campos.decimal(body.containsKey("fibras") ? body.get("fibras") : body.get("fiber")) : r.getFibras());
            } else totais = calcular(body);
        } catch (IllegalArgumentException e) { return erro(400, e.getMessage()); }
        if (totais.calorias() == null || totais.calorias() < 0) return erro(400, "Informe calorias válidas para a refeição");
        String nome = primeiroTexto(body, "nome", "mealType");
        if (nome != null) r.setNome(nome);
        if (body.containsKey("descricao") || body.containsKey("description")) r.setDescricao(primeiroTexto(body, "descricao", "description"));
        aplicarTotais(r, totais);
        return ResponseEntity.ok(refeicoes.save(r));
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

    @GetMapping("/resumo")
    public ResponseEntity<?> resumoDia(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(required = false) String date) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        String dia = date == null || date.isBlank() ? java.time.LocalDate.now().toString() : date;
        List<DiarioRefeicao> registros = refeicoes.findByPacienteIdOrderByCriadoEmDesc(id).stream().filter(r -> dia.equals(r.getEntryDate())).toList();
        return ResponseEntity.ok(Map.of("date", dia, "refeicoes", registros, "calorias", soma(registros, 0), "carboidratos", soma(registros, 1), "proteinas", soma(registros, 2), "gorduras", soma(registros, 3), "fibras", soma(registros, 4)));
    }
    private CalculoRefeicao.Totais calcular(Map<String, Object> body) {
        return calculo.calcular(body.containsKey("itens") ? body.get("itens") : body.get("items"), Campos.decimal(body.containsKey("calorias") ? body.get("calorias") : body.get("calories")), Campos.decimal(body.containsKey("carboidratos") ? body.get("carboidratos") : body.get("carbs")), Campos.decimal(body.containsKey("proteinas") ? body.get("proteinas") : body.get("protein")), Campos.decimal(body.containsKey("gorduras") ? body.get("gorduras") : body.get("fat")), Campos.decimal(body.containsKey("fibras") ? body.get("fibras") : body.get("fiber")));
    }
    private static void aplicarTotais(DiarioRefeicao r, CalculoRefeicao.Totais t) { r.setCalorias(t.calorias()); r.setCarboidratos(t.carboidratos()); r.setProteinas(t.proteinas()); r.setGorduras(t.gorduras()); r.setFibras(t.fibras()); r.setItens(t.itens()); }
    private static double soma(List<DiarioRefeicao> rs, int campo) { return rs.stream().mapToDouble(r -> { Double v = switch(campo) { case 0 -> r.getCalorias(); case 1 -> r.getCarboidratos(); case 2 -> r.getProteinas(); case 3 -> r.getGorduras(); default -> r.getFibras(); }; return v == null ? 0 : v; }).sum(); }
    private static String primeiroTexto(Map<String, Object> body, String... nomes) {
        for (String nome : nomes) {
            String valor = Campos.texto(body.get(nome));
            if (valor != null) return valor;
        }
        return null;
    }
}
