package com.petsplace.gestion.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "configuraciones", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Configuracion {

    @Id
    @Column(nullable = false, length = 100)
    private String clave;

    @Column(columnDefinition = "TEXT")
    private String valor;
}
