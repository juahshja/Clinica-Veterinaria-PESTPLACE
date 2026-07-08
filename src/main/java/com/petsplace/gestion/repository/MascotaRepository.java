package com.petsplace.gestion.repository;

import com.petsplace.gestion.model.Mascota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Long> {
    List<Mascota> findByClienteId(Long clienteId);

    // Trae todas las mascotas junto con su cliente en UNA sola consulta (evita el problema N+1)
    @Query("SELECT m FROM Mascota m LEFT JOIN FETCH m.cliente")
    List<Mascota> findAllWithCliente();
}