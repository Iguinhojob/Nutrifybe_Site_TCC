package com.nutrifybe.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.DiarioAguaRepository;
import com.nutrifybe.repository.DiarioMedidaRepository;
import com.nutrifybe.repository.DiarioRefeicaoRepository;
import com.nutrifybe.repository.NutricionistaRepository;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.repository.SolicitacaoPendenteRepository;
import com.nutrifybe.model.Nutricionista;
import com.nutrifybe.model.SolicitacaoPendente;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Rotas clínicas do nutricionista; só expõem pacientes com vínculo aceito pelo próprio profissional. */
@RestController
@RequestMapping("/api/nutri/pacientes")
public class AcompanhamentoNutricionalController {
    private final PacienteRepository pacientes;
    private final NutricionistaRepository nutricionistas;
    private final DiarioRefeicaoRepository refeicoes;
    private final DiarioAguaRepository agua;
    private final DiarioMedidaRepository medidas;
    private final TokenService tokens;
    private final ObjectMapper json;
    private final SolicitacaoPendenteRepository solicitacoes;

    public AcompanhamentoNutricionalController(PacienteRepository pacientes,
            NutricionistaRepository nutricionistas, DiarioRefeicaoRepository refeicoes,
            DiarioAguaRepository agua, DiarioMedidaRepository medidas, TokenService tokens,
            ObjectMapper json, SolicitacaoPendenteRepository solicitacoes) {
        this.pacientes = pacientes;
        this.nutricionistas = nutricionistas;
        this.refeicoes = refeicoes;
        this.agua = agua;
        this.medidas = medidas;
        this.tokens = tokens;
        this.json = json;
        this.solicitacoes = solicitacoes;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long nutriId = nutricionistaAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        return ResponseEntity.ok(pacientes.findByNutricionistaIdAndStatusOrderByNomeAsc(nutriId, "accepted")
                .stream().map(this::resumo).toList());
    }

    @GetMapping("/{pacienteId}")
    public ResponseEntity<?> ficha(@RequestHeader(value = "Authorization", required = false) String auth,
                                   @PathVariable Long pacienteId) {
        Long nutriId = nutricionistaAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        Paciente paciente = pacienteAceito(pacienteId, nutriId);
        if (paciente == null) return erro(404, "Paciente não encontrado ou sem vínculo aceito");
        Map<String, Object> ficha = resumo(paciente);
        ficha.put("refeicoes", refeicoes.findByPacienteIdOrderByCriadoEmDesc(pacienteId));
        ficha.put("agua", agua.findByPacienteIdOrderByCriadoEmDesc(pacienteId));
        ficha.put("medidas", medidas.findByPacienteIdOrderByCriadoEmDesc(pacienteId));
        return ResponseEntity.ok(ficha);
    }

    @PutMapping("/{pacienteId}")
    public ResponseEntity<?> atualizarPlano(@RequestHeader(value = "Authorization", required = false) String auth,
                                            @PathVariable Long pacienteId,
                                            @RequestBody Map<String, Object> body) {
        Long nutriId = nutricionistaAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        Paciente paciente = pacienteAceito(pacienteId, nutriId);
        if (paciente == null) return erro(404, "Paciente não encontrado ou sem vínculo aceito");
        if (body.containsKey("prescricaoSemanal")) {
            paciente.setPrescricaoSemanal(Campos.texto(body.get("prescricaoSemanal")));
        }
        if (body.containsKey("calendario")) {
            Object calendario = body.get("calendario");
            try {
                paciente.setCalendario(calendario == null ? null
                        : calendario instanceof String texto ? texto : json.writeValueAsString(calendario));
            } catch (Exception e) {
                return erro(400, "Calendário inválido");
            }
        }
        pacientes.save(paciente);
        return ResponseEntity.ok(resumo(paciente));
    }

    @PostMapping("/{pacienteId}/transferir")
    @Transactional
    public ResponseEntity<?> transferir(@RequestHeader(value = "Authorization", required = false) String auth,
                                        @PathVariable Long pacienteId, @RequestBody Map<String, Object> body) {
        Long nutriId = nutricionistaAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        Paciente paciente = pacienteAceito(pacienteId, nutriId);
        if (paciente == null) return erro(404, "Paciente não encontrado ou sem vínculo aceito");
        Long destino;
        try { destino = Long.valueOf(body.get("nutricionistaId").toString()); }
        catch (Exception e) { return erro(400, "Informe o nutricionista de destino"); }
        Nutricionista novoNutri = nutricionistas.findById(destino)
                .filter(n -> "approved".equalsIgnoreCase(n.getStatus()) && Integer.valueOf(1).equals(n.getAtivo()))
                .orElse(null);
        if (novoNutri == null) return erro(400, "Nutricionista de destino indisponível");
        paciente.setNutricionistaId(destino);
        paciente.setStatus("pending");
        pacientes.save(paciente);
        if (!solicitacoes.existsByEmailIgnoreCaseAndNutricionistaId(paciente.getEmail(), destino)) {
            SolicitacaoPendente pedido = new SolicitacaoPendente();
            pedido.setNome(paciente.getNome());
            pedido.setEmail(paciente.getEmail());
            pedido.setIdade(paciente.getIdade());
            pedido.setPeso(paciente.getPeso());
            pedido.setAltura(paciente.getAltura());
            pedido.setObjetivo(paciente.getObjetivo());
            pedido.setCondicaoSaude(paciente.getCondicaoSaude());
            pedido.setNutricionistaId(destino);
            solicitacoes.save(pedido);
        }
        return ResponseEntity.ok(resumo(paciente));
    }

    @DeleteMapping("/{pacienteId}/vinculo")
    @Transactional
    public ResponseEntity<?> encerrarVinculo(@RequestHeader(value = "Authorization", required = false) String auth,
                                             @PathVariable Long pacienteId) {
        Long nutriId = nutricionistaAtivo(auth);
        if (nutriId == null) return erro(401, "Sessão de nutricionista inválida");
        Paciente paciente = pacienteAceito(pacienteId, nutriId);
        if (paciente == null) return erro(404, "Paciente não encontrado ou sem vínculo aceito");
        paciente.setNutricionistaId(null);
        paciente.setStatus("solo");
        pacientes.save(paciente);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long nutricionistaAtivo(String auth) {
        Long id = tokens.validarNutricionista(auth);
        if (id == null) return null;
        return nutricionistas.findById(id)
                .filter(n -> "approved".equalsIgnoreCase(n.getStatus()) && Integer.valueOf(1).equals(n.getAtivo()))
                .map(n -> n.getId()).orElse(null);
    }

    private Paciente pacienteAceito(Long pacienteId, Long nutriId) {
        return pacientes.findById(pacienteId)
                .filter(p -> nutriId.equals(p.getNutricionistaId()) && "accepted".equalsIgnoreCase(p.getStatus()))
                .orElse(null);
    }

    private Map<String, Object> resumo(Paciente p) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", p.getId());
        out.put("nome", p.getNome());
        out.put("email", p.getEmail());
        out.put("idade", p.getIdade());
        out.put("dataNascimento", p.getDataNascimento());
        out.put("sexo", p.getSexo());
        out.put("peso", p.getPeso());
        out.put("altura", p.getAltura());
        out.put("pesoMeta", p.getPesoMeta());
        out.put("metaAgua", p.getMetaAgua());
        out.put("objetivo", p.getObjetivo());
        out.put("atividade", p.getAtividade());
        out.put("motivacao", p.getMotivacao());
        out.put("restricoes", p.getRestricoes());
        out.put("observacoes", p.getObservacoes());
        out.put("condicaoSaude", p.getCondicaoSaude());
        out.put("origem", p.getOrigem());
        out.put("preferenciaAcompanhamento", p.getPreferenciaAcompanhamento());
        out.put("nutricionistaId", p.getNutricionistaId());
        out.put("status", p.getStatus());
        out.put("prescricaoSemanal", p.getPrescricaoSemanal());
        out.put("calendario", p.getCalendario());
        out.put("dataCriacao", p.getDataCriacao());
        return out;
    }

    private ResponseEntity<?> erro(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("success", false, "message", mensagem));
    }
}
