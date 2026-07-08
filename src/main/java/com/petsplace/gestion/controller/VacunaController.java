package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Vacuna;
import com.petsplace.gestion.repository.VacunaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/vacunas")
@CrossOrigin(origins = "*")
public class VacunaController {

    @Autowired
    private VacunaRepository vacunaRepository;

    @GetMapping
    public List<Vacuna> listarTodas() {
        return vacunaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vacuna> obtenerPorId(@PathVariable Long id) {
        return vacunaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Vacuna crear(@RequestBody Vacuna vacuna) {
        return vacunaRepository.save(vacuna);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vacuna> actualizar(@PathVariable Long id, @RequestBody Vacuna vacunaDetails) {
        return vacunaRepository.findById(id).map(vacuna -> {
            vacuna.setNombre(vacunaDetails.getNombre());
            vacuna.setEspecieDestino(vacunaDetails.getEspecieDestino());
            vacuna.setDosis(vacunaDetails.getDosis());
            vacuna.setDiasRefuerzo(vacunaDetails.getDiasRefuerzo());
            vacuna.setDescripcion(vacunaDetails.getDescripcion());
            Vacuna actualizada = vacunaRepository.save(vacuna);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return vacunaRepository.findById(id).map(vacuna -> {
            vacunaRepository.delete(vacuna);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
