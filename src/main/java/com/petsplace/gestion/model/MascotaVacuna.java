package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "mascotas_vacunas", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MascotaVacuna {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mascota_id", nullable = false, foreignKey = @ForeignKey(name = "fk_vacuna_mascota"))
    private Mascota mascota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacuna_id", nullable = false, foreignKey = @ForeignKey(name = "fk_vacuna_catalogo"))
    private Vacuna vacuna;

    @Column(name = "fecha_aplicacion", nullable = false)
    private LocalDate fechaAplicacion;

    @Column(name = "fecha_siguiente")
    private LocalDate fechaSiguiente;

    @Column(length = 50)
    private String estado = "Aplicada"; // e.g. "Aplicada", "Pendiente", "Vencida"
}