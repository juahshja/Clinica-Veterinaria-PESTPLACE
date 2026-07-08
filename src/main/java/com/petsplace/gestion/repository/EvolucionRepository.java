package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Evolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvolucionRepository extends JpaRepository<Evolucion, Long> {
    @Query("SELECT e FROM Evolucion e LEFT JOIN FETCH e.mascota WHERE e.mascota.id = :mascotaId ORDER BY e.fecha DESC")
    List<Evolucion> findByMascotaIdOrderByFechaDesc(@Param("mascotaId") Long mascotaId);
}