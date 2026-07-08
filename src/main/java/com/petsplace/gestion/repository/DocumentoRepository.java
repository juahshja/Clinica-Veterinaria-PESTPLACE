package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Documento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    @Query("SELECT d FROM Documento d LEFT JOIN FETCH d.mascota WHERE d.mascota.id = :mascotaId ORDER BY d.id DESC")
    List<Documento> findByMascotaIdOrderByIdDesc(@Param("mascotaId") Long mascotaId);
}