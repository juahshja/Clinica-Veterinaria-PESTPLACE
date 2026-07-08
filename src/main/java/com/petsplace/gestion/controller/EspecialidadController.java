package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Especialidad;
import com.petsplace.gestion.repository.EspecialidadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/especialidades")
@CrossOrigin(origins = "*")
public class EspecialidadController {

    @Autowired
    private EspecialidadRepository especialidadRepository;

    @GetMapping
    public List<Especialidad> listarTodas() {
        return especialidadRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Especialidad> obtenerPorId(@PathVariable Long id) {
        return especialidadRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Especialidad crear(@RequestBody Especialidad especialidad) {
        return especialidadRepository.save(especialidad);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Especialidad> actualizar(@PathVariable Long id, @RequestBody Especialidad especialidadDetails) {
        return especialidadRepository.findById(id).map(especialidad -> {
            especialidad.setNombre(especialidadDetails.getNombre());
            especialidad.setDescripcion(especialidadDetails.getDescripcion());
            especialidad.setEstado(especialidadDetails.getEstado());
            Especialidad actualizada = especialidadRepository.save(especialidad);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return especialidadRepository.findById(id).map(especialidad -> {
            especialidadRepository.delete(especialidad);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
