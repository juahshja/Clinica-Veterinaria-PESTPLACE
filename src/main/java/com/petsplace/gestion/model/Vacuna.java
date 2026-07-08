package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vacunas", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vacuna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "especie_destino", length = 50)
    private String especieDestino;

    @Column(length = 50)
    private String dosis;

    @Column(name = "dias_refuerzo")
    private Integer diasRefuerzo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;
}
