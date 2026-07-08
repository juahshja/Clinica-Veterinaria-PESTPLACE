package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "citas", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mascota_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cita_mascota"))
    private Mascota mascota;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 10)
    private String hora;

    @Column(length = 255)
    private String motivo;

    @Column(length = 100)
    private String veterinario;

    @Column(length = 50)
    private String estado = "Pendiente"; // "Pendiente", "Confirmada", "En atención", "Completada", "Cancelada", "No asistió"
}