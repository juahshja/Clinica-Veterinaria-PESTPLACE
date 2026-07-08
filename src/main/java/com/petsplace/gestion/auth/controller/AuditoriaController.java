package com.petsplace.gestion.auth.controller;

import com.petsplace.gestion.auth.model.Auditoria;
import com.petsplace.gestion.auth.repository.AuditoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaController {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @GetMapping
    public List<Auditoria> obtenerTodos() {
        return auditoriaRepository.findAllByOrderByFechaDesc();
    }

    @PostMapping
    public ResponseEntity<Auditoria> registrar(@RequestBody Auditoria auditoria) {
        if (auditoria.getFecha() == null) {
            auditoria.setFecha(LocalDateTime.now());
        }
        Auditoria guardado = auditoriaRepository.save(auditoria);
        return ResponseEntity.ok(guardado);
    }
}
