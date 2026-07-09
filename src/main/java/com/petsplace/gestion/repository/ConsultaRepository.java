package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConsultaRepository extends JpaRepository<Consulta, Long> {

    @Query("SELECT c FROM Consulta c LEFT JOIN FETCH c.mascota m LEFT JOIN FETCH m.cliente WHERE m.id = :mascotaId ORDER BY c.fecha DESC")
    List<Consulta> findByMascotaIdOrderByFechaDesc(@Param("mascotaId") Long mascotaId);

    // Trae todas las consultas junto con su mascota en UNA sola consulta (evita el problema N+1)
    @Query("SELECT c FROM Consulta c LEFT JOIN FETCH c.mascota m LEFT JOIN FETCH m.cliente")
    List<Consulta> findAllWithMascota();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Consulta c SET c.veterinario = :nuevoNombre WHERE c.veterinario = :antiguoNombre")
    void actualizarNombreVeterinario(@Param("antiguoNombre") String antiguoNombre, @Param("nuevoNombre") String nuevoNombre);
}