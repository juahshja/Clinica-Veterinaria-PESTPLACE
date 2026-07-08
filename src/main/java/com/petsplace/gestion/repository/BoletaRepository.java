package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {
    Optional<Boleta> findByNroBoleta(String nroBoleta);
    List<Boleta> findAllByOrderByFechaDesc();

    // Trae todas las boletas junto con sus detalles en UNA sola consulta (evita el problema N+1)
    @Query("SELECT DISTINCT b FROM Boleta b LEFT JOIN FETCH b.detalles ORDER BY b.fecha DESC")
    List<Boleta> findAllWithDetallesOrderByFechaDesc();
}