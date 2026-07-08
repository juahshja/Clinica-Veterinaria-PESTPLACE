package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.MascotaVacuna;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MascotaVacunaRepository extends JpaRepository<MascotaVacuna, Long> {
    @Query("SELECT mv FROM MascotaVacuna mv LEFT JOIN FETCH mv.mascota LEFT JOIN FETCH mv.vacuna WHERE mv.mascota.id = :mascotaId")
    List<MascotaVacuna> findByMascotaId(@Param("mascotaId") Long mascotaId);
}