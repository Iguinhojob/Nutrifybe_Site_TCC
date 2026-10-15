package com.nutrifybe.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** Garante que fotos em base64 nao fiquem limitadas ao tamanho padrao de String no SQL Server. */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class FotoPacienteSchemaMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    public FotoPacienteSchemaMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("IF COL_LENGTH('Pacientes', 'foto') IS NULL " +
                "ALTER TABLE Pacientes ADD foto NVARCHAR(MAX) NULL; " +
                "ELSE ALTER TABLE Pacientes ALTER COLUMN foto NVARCHAR(MAX) NULL;");
    }
}
