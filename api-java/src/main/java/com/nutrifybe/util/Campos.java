package com.nutrifybe.util;

import java.time.Instant;

public final class Campos {
    private Campos() {}

    public static String texto(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    public static Double decimal(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.valueOf(o.toString().trim().replace(',', '.'));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Integer inteiro(Object o) {
        Double d = decimal(o);
        return d == null ? null : (int) Math.round(d);
    }

    public static String dataOuAgora(Object o) {
        String s = texto(o);
        if (s != null) {
            try {
                return Instant.parse(s).toString();
            } catch (Exception ignored) {
                // usa a data de agora
            }
        }
        return Instant.now().toString();
    }
}
