package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Consulta;
import com.petsplace.gestion.repository.ConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/consultas")
@CrossOrigin(origins = "*")
public class ConsultaController {

    @Autowired
    private ConsultaRepository consultaRepository;

    @GetMapping
    public List<Consulta> listarTodas() {
        return consultaRepository.findAllWithMascota();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Consulta> obtenerPorId(@PathVariable Long id) {
        return consultaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Consulta crear(@RequestBody Consulta consulta) {
        return consultaRepository.save(consulta);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Consulta> actualizar(@PathVariable Long id, @RequestBody Consulta consultaDetails) {
        return consultaRepository.findById(id).map(consulta -> {
            consulta.setMotivo(consultaDetails.getMotivo());
            consulta.setDiagnostico(consultaDetails.getDiagnostico());
            consulta.setTratamiento(consultaDetails.getTratamiento());
            consulta.setMedicamentos(consultaDetails.getMedicamentos());
            consulta.setCosto(consultaDetails.getCosto());
            if (consultaDetails.getFecha() != null) {
                consulta.setFecha(consultaDetails.getFecha());
            }
            Consulta actualizada = consultaRepository.save(consulta);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return consultaRepository.findById(id).map(consulta -> {
            consultaRepository.delete(consulta);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}