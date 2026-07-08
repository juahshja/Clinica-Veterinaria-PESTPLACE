package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Cita;
import com.petsplace.gestion.repository.CitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/citas")
@CrossOrigin(origins = "*")
public class CitaController {

    @Autowired
    private CitaRepository citaRepository;

    @GetMapping
    public List<Cita> listarTodas(@RequestParam(required = false) String fecha) {
        if (fecha != null && !fecha.isEmpty()) {
            try {
                LocalDate date = LocalDate.parse(fecha);
                return citaRepository.findByFechaWithMascota(date);
            } catch (Exception e) {
                // Si la fecha tiene formato inválido, ignoramos el filtro
            }
        }
        return citaRepository.findAllWithMascota();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cita> obtenerPorId(@PathVariable Long id) {
        return citaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Cita crear(@RequestBody Cita cita) {
        return citaRepository.save(cita);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cita> actualizar(@PathVariable Long id, @RequestBody Cita citaDetails) {
        return citaRepository.findById(id).map(cita -> {
            cita.setFecha(citaDetails.getFecha());
            cita.setHora(citaDetails.getHora());
            cita.setMotivo(citaDetails.getMotivo());
            cita.setVeterinario(citaDetails.getVeterinario());
            cita.setEstado(citaDetails.getEstado());
            cita.setMascota(citaDetails.getMascota());
            Cita actualizada = citaRepository.save(cita);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Cita> actualizarEstado(@PathVariable Long id, @RequestBody String nuevoEstado) {
        // Limpiamos comillas si vienen en el body
        String estadoLimpio = nuevoEstado.replace("\"", "").trim();
        return citaRepository.findById(id).map(cita -> {
            cita.setEstado(estadoLimpio);
            Cita actualizada = citaRepository.save(cita);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return citaRepository.findById(id).map(cita -> {
            citaRepository.delete(cita);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}