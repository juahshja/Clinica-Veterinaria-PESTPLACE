package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "evoluciones", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Evolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mascota_id", nullable = false, foreignKey = @ForeignKey(name = "fk_evolucion_mascota"))
    private Mascota mascota;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private Double peso;

    private String temperatura;

    @Column(columnDefinition = "TEXT")
    private String notas;
}