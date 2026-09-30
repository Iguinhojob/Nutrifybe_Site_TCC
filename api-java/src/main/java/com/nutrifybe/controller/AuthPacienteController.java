package com.nutrifybe.controller;

import com.nutrifybe.model.Paciente;
import com.nutrifybe.repository.PacienteRepository;
import com.nutrifybe.security.TokenService;
import com.nutrifybe.util.Campos;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/** Cadastro, login e perfil do paciente (usado pelo app mobile). */
@RestController
@RequestMapping({"/api/auth/paciente", "/api/auth"})
public class AuthPacienteController {

    private final PacienteRepository repository;
    private final TokenService tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthPacienteController(PacienteRepository repository, TokenService tokens) {
        this.repository = repository;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        String nome = primeiroTexto(body, "nome", "name");
        String email = Campos.texto(body.get("email"));
        String senha = primeiroTexto(body, "senha", "password");

        if (nome == null || email == null || !email.contains("@")) {
            return erro(400, "Informe nome e e-mail válidos");
        }
        if (senha == null || senha.length() < 6) {
            return erro(400, "A senha precisa ter pelo menos 6 caracteres");
        }
        String emailFinal = email.toLowerCase();
        if (repository.existsByEmailIgnoreCase(emailFinal)) {
            return erro(409, "E-mail já cadastrado");
        }

        Paciente p = new Paciente();
        p.setNome(nome);
        p.setEmail(emailFinal);
        p.setSenha(encoder.encode(senha));
        p.setIdade(body.containsKey("idade") ? Campos.inteiro(body.get("idade")) : idadeDe(body.get("birthDate")));
        p.setDataNascimento(primeiroTexto(body, "dataNascimento", "birthDate"));
        p.setSexo(Campos.texto(body.get("sexo")));
        p.setPeso(body.containsKey("peso") ? Campos.decimal(body.get("peso")) : Campos.decimal(body.get("weight")));
        p.setAltura(body.containsKey("altura") ? Campos.decimal(body.get("altura")) : Campos.decimal(body.get("height")));
        p.setPesoMeta(body.containsKey("pesoMeta") ? Campos.decimal(body.get("pesoMeta")) : Campos.decimal(body.get("targetWeight")));
        p.setMetaAgua(body.containsKey("metaAgua") ? Campos.decimal(body.get("metaAgua")) : Campos.decimal(body.get("waterGoal")));
        p.setObjetivo(primeiroTexto(body, "objetivo", "goal"));
        p.setAtividade(primeiroTexto(body, "atividade", "activityLevel"));
        p.setMotivacao(primeiroTexto(body, "motivacao", "motivation"));
        p.setRestricoes(primeiroTexto(body, "restricoes", "restrictions"));
        p.setObservacoes(primeiroTexto(body, "observacoes", "healthNote"));
        p.setOrigem(Campos.texto(body.get("origem")));
        p.setPreferenciaAcompanhamento(primeiroTexto(body, "preferenciaAcompanhamento", "followupPreference"));
        p.setCondicaoSaude(primeiroTexto(body, "condicaoSaude", "healthNote", "restrictions"));
        p.setStatus("solo");
        p.setAtivo(1);
        p.setDataCriacao(Instant.now().toString());
        repository.save(p);
        return ResponseEntity.ok(resposta(p));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email = Campos.texto(body.get("email"));
        String senha = primeiroTexto(body, "senha", "password");
        if (email == null || senha == null) {
            return erro(400, "Informe e-mail e senha");
        }

        Optional<Paciente> op = repository.findFirstByEmailIgnoreCaseAndSenhaIsNotNull(email);
        if (op.isEmpty() || !encoder.matches(senha, op.get().getSenha())) {
            return erro(401, "E-mail ou senha inválidos");
        }
        Paciente p = op.get();
        if (p.getAtivo() != null && p.getAtivo() == 0) {
            return erro(403, "Conta inativa");
        }
        return ResponseEntity.ok(resposta(p));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");
        return ResponseEntity.ok(op.get());
    }

    @PutMapping("/me")
    public ResponseEntity<?> atualizar(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @RequestBody Map<String, Object> body) {
        Long id = tokens.validar(auth);
        if (id == null) return erro(401, "Sessão inválida");
        Optional<Paciente> op = repository.findById(id);
        if (op.isEmpty()) return erro(404, "Paciente não encontrado");

        Paciente p = op.get();
        String nome = primeiroTexto(body, "nome", "name");
        if (nome != null) p.setNome(nome);
        if (body.containsKey("idade")) p.setIdade(Campos.inteiro(body.get("idade")));
        if (body.containsKey("peso") || body.containsKey("weight")) p.setPeso(Campos.decimal(body.containsKey("peso") ? body.get("peso") : body.get("weight")));
        if (body.containsKey("altura") || body.containsKey("height")) p.setAltura(Campos.decimal(body.containsKey("altura") ? body.get("altura") : body.get("height")));
        if (body.containsKey("objetivo") || body.containsKey("goal")) p.setObjetivo(primeiroTexto(body, "objetivo", "goal"));
        if (body.containsKey("condicaoSaude") || body.containsKey("healthNote")) p.setCondicaoSaude(primeiroTexto(body, "condicaoSaude", "healthNote"));
        if (body.containsKey("nutricionistaId")) p.setNutricionistaId(Long.valueOf(body.get("nutricionistaId").toString()));
        if (body.containsKey("status")) p.setStatus(Campos.texto(body.get("status")));
        if (body.containsKey("prescricaoSemanal")) p.setPrescricaoSemanal(Campos.texto(body.get("prescricaoSemanal")));
        if (body.containsKey("calendario")) p.setCalendario(Campos.texto(body.get("calendario")));
        if (body.containsKey("dataNascimento")) p.setDataNascimento(Campos.texto(body.get("dataNascimento")));
        if (body.containsKey("sexo")) p.setSexo(Campos.texto(body.get("sexo")));
        if (body.containsKey("pesoMeta")) p.setPesoMeta(Campos.decimal(body.get("pesoMeta")));
        if (body.containsKey("metaAgua")) p.setMetaAgua(Campos.decimal(body.get("metaAgua")));
        if (body.containsKey("atividade")) p.setAtividade(Campos.texto(body.get("atividade")));
        if (body.containsKey("motivacao")) p.setMotivacao(Campos.texto(body.get("motivacao")));
        if (body.containsKey("restricoes")) p.setRestricoes(Campos.texto(body.get("restricoes")));
        if (body.containsKey("observacoes")) p.setObservacoes(Campos.texto(body.get("observacoes")));
        if (body.containsKey("origem")) p.setOrigem(Campos.texto(body.get("origem")));
        if (body.containsKey("preferenciaAcompanhamento")) p.setPreferenciaAcompanhamento(Campos.texto(body.get("preferenciaAcompanhamento")));
        repository.save(p);
        return ResponseEntity.ok(p);
    }

    private Map<String, Object> resposta(Paciente p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("success", true);
        m.put("token", tokens.gerar(p.getId()));
        m.put("paciente", p);
        return m;
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

    private static Integer idadeDe(Object valor) {
        String texto = Campos.texto(valor);
        if (texto == null) return null;
        for (DateTimeFormatter formato : new DateTimeFormatter[]{DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("dd/MM/yyyy")}) {
            try { return Period.between(LocalDate.parse(texto, formato), LocalDate.now()).getYears(); }
            catch (DateTimeParseException ignored) { }
        }
        return null;
    }
}
