package com.petsplace.gestion.auth.repository;

import com.petsplace.gestion.auth.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    // Retorna todos los registros de auditoría ordenados por fecha de forma descendente
    List<Auditoria> findAllByOrderByFechaDesc();
}
