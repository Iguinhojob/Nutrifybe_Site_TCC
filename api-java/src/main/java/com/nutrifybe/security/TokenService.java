package com.nutrifybe.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/** Gera e valida o token de login do paciente (assinado com HMAC-SHA256). */
@Service
public class TokenService {

    private final byte[] segredo;
    private final long horas;

    public TokenService(@Value("${app.jwt.secret}") String segredo,
                        @Value("${app.jwt.horas:720}") long horas) {
        this.segredo = segredo.getBytes(StandardCharsets.UTF_8);
        this.horas = horas;
    }

    public String gerar(Long pacienteId) {
        return gerarCorpo(pacienteId + ":" + (System.currentTimeMillis() / 1000 + horas * 3600));
    }

    public String gerarNutricionista(Long nutricionistaId) {
        return gerarCorpo("nutri:" + nutricionistaId + ":" + (System.currentTimeMillis() / 1000 + horas * 3600));
    }

    /** Recebe o cabeçalho "Authorization: Bearer ..." e devolve o id do paciente, ou null se inválido. */
    public Long validar(String cabecalho) {
        if (cabecalho == null || !cabecalho.startsWith("Bearer ")) return null;
        String token = cabecalho.substring(7).trim();
        int ponto = token.indexOf('.');
        if (ponto < 1) return null;
        String corpo = token.substring(0, ponto);
        try {
            byte[] recebida = Base64.getUrlDecoder().decode(token.substring(ponto + 1));
            if (!MessageDigest.isEqual(assinar(corpo), recebida)) return null;
            String[] partes = new String(Base64.getUrlDecoder().decode(corpo), StandardCharsets.UTF_8).split(":");
            if (partes.length != 2) return null;
            long expira = Long.parseLong(partes[1]);
            if (expira < System.currentTimeMillis() / 1000) return null;
            return Long.valueOf(partes[0]);
        } catch (Exception e) {
            return null;
        }
    }

    public Long validarNutricionista(String cabecalho) {
        String[] partes = validarCorpo(cabecalho);
        if (partes == null || partes.length != 3 || !"nutri".equals(partes[0])) return null;
        try { return Long.valueOf(partes[1]); } catch (NumberFormatException e) { return null; }
    }

    private String gerarCorpo(String valor) {
        String corpo = b64(valor.getBytes(StandardCharsets.UTF_8));
        return corpo + "." + b64(assinar(corpo));
    }

    private String[] validarCorpo(String cabecalho) {
        if (cabecalho == null || !cabecalho.startsWith("Bearer ")) return null;
        String token = cabecalho.substring(7).trim();
        int ponto = token.indexOf('.');
        if (ponto < 1) return null;
        String corpo = token.substring(0, ponto);
        try {
            byte[] recebida = Base64.getUrlDecoder().decode(token.substring(ponto + 1));
            if (!MessageDigest.isEqual(assinar(corpo), recebida)) return null;
            String[] partes = new String(Base64.getUrlDecoder().decode(corpo), StandardCharsets.UTF_8).split(":");
            if (partes.length < 2 || Long.parseLong(partes[partes.length - 1]) < System.currentTimeMillis() / 1000) return null;
            return partes;
        } catch (Exception e) { return null; }
    }

    private byte[] assinar(String dados) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(segredo, "HmacSHA256"));
            return mac.doFinal(dados.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
