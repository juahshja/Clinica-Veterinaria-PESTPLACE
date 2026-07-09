package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByFecha(LocalDate fecha);

    // Trae todas las citas junto con su mascota y el dueño de la mascota en UNA sola consulta
    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.mascota m LEFT JOIN FETCH m.cliente")
    List<Cita> findAllWithMascota();

    @Query("SELECT c FROM Cita c LEFT JOIN FETCH c.mascota m LEFT JOIN FETCH m.cliente WHERE c.fecha = :fecha")
    List<Cita> findByFechaWithMascota(@Param("fecha") LocalDate fecha);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Cita c SET c.veterinario = :nuevoNombre WHERE c.veterinario = :antiguoNombre")
    void actualizarNombreVeterinario(@Param("antiguoNombre") String antiguoNombre, @Param("nuevoNombre") String nuevoNombre);
}