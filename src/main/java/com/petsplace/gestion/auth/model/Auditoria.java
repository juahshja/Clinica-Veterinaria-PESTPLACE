package com.petsplace.gestion.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(nullable = false, length = 100)
    private String usuario;

    @Column(nullable = false, length = 50)
    private String rol;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, length = 100)
    private String accion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String detalles;

    @Column(length = 45)
    private String ip = "127.0.0.1";

    @Column(nullable = false, length = 20)
    private String estado = "ÉXITO";
}
