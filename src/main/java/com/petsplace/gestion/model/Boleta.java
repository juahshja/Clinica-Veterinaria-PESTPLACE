package com.petsplace.gestion.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "boletas", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nro_boleta", nullable = false, unique = true, length = 50)
    private String nroBoleta;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(name = "cliente_nombre", length = 150)
    private String clienteNombre;

    @Column(name = "cliente_dni", length = 20)
    private String clienteDni;

    @Column(name = "mascota_nombre", length = 100)
    private String mascotaNombre;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(length = 100)
    private String cajero;

    @Column(nullable = false, length = 50)
    private String estado = "Activa";

    @Column(name = "anulacion_motivo", length = 255)
    private String anulacionMotivo;

    @Column(nullable = false)
    private Double total;

    @OneToMany(mappedBy = "boleta", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<BoletaDetalle> detalles = new ArrayList<>();
}
