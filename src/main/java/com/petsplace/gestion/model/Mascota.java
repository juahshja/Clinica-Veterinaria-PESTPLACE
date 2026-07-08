package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "mascotas", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Mascota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String especie;

    @Column(length = 100)
    private String raza;

    @Column(length = 20)
    private String sexo;

    private Integer edad;

    private Double peso;

    @Column(length = 50)
    private String color;

    @Column(length = 50)
    private String emoji;

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", foreignKey = @ForeignKey(name = "fk_mascota_cliente"))
    private Cliente cliente;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(name = "notas_clinicas", columnDefinition = "TEXT")
    private String notasClinicas;

    @Column(length = 50)
    private String estado = "Activo";
}