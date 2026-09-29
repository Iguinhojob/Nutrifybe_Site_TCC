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
    public ResponseEntity<?> listarRefeicoes(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return ResponseEntity.ok(refeicoes.findByPacienteIdOrderByCriadoEmDesc(id));
    }

    @PostMapping("/refeicoes")
    public ResponseEntity<?> criarRefeicao(@RequestHeader(value = "Authorization", required = false) String auth,
                                           @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        Double calorias = Campos.decimal(body.get("calorias"));
        if (calorias == null || calorias < 0) return erro(400, "Informe as calorias da refeição");

        DiarioRefeicao r = new DiarioRefeicao();
        r.setPacienteId(id);
        r.setNome(Campos.texto(body.get("nome")) != null ? Campos.texto(body.get("nome")) : "Refeição");
        r.setDescricao(Campos.texto(body.get("descricao")));
        r.setCalorias(calorias);
        r.setCarboidratos(Campos.decimal(body.get("carboidratos")));
        r.setProteinas(Campos.decimal(body.get("proteinas")));
        r.setGorduras(Campos.decimal(body.get("gorduras")));
        r.setItens(Campos.texto(body.get("itens")));
        r.setOrigem(Campos.texto(body.get("origem")));
        r.setReferenciaId(Campos.texto(body.get("referenciaId")));
        r.setCriadoEm(Campos.dataOuAgora(body.get("criadoEm")));
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
    public ResponseEntity<?> listarAgua(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        return ResponseEntity.ok(agua.findByPacienteIdOrderByCriadoEmDesc(id));
    }

    @PostMapping("/agua")
    public ResponseEntity<?> criarAgua(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return naoAutorizado();
        Integer ml = Campos.inteiro(body.get("quantidadeMl"));
        if (ml == null || ml <= 0) return erro(400, "Informe a quantidade de água em ml");

        DiarioAgua a = new DiarioAgua();
        a.setPacienteId(id);
        a.setQuantidadeMl(ml);
        a.setCriadoEm(Campos.dataOuAgora(body.get("criadoEm")));
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
}
