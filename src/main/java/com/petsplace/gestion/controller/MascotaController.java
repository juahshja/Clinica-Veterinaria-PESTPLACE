package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Mascota;
import com.petsplace.gestion.model.MascotaVacuna;
import com.petsplace.gestion.model.Consulta;
import com.petsplace.gestion.model.Evolucion;
import com.petsplace.gestion.model.Documento;
import com.petsplace.gestion.repository.MascotaRepository;
import com.petsplace.gestion.repository.MascotaVacunaRepository;
import com.petsplace.gestion.repository.ConsultaRepository;
import com.petsplace.gestion.repository.EvolucionRepository;
import com.petsplace.gestion.repository.DocumentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/mascotas")
@CrossOrigin(origins = "*")
public class MascotaController {

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private MascotaVacunaRepository mascotaVacunaRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private EvolucionRepository evolucionRepository;

    @Autowired
    private DocumentoRepository documentoRepository;

    @GetMapping
    public List<Mascota> listarTodas() {
        return mascotaRepository.findAllWithCliente();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Mascota> obtenerPorId(@PathVariable Long id) {
        return mascotaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mascota crear(@RequestBody Mascota mascota) {
        return mascotaRepository.save(mascota);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Mascota> actualizar(@PathVariable Long id, @RequestBody Mascota mascotaDetails) {
        return mascotaRepository.findById(id).map(mascota -> {
            mascota.setNombre(mascotaDetails.getNombre());
            mascota.setEspecie(mascotaDetails.getEspecie());
            mascota.setRaza(mascotaDetails.getRaza());
            mascota.setSexo(mascotaDetails.getSexo());
            mascota.setEdad(mascotaDetails.getEdad());
            mascota.setPeso(mascotaDetails.getPeso());
            mascota.setColor(mascotaDetails.getColor());
            mascota.setEmoji(mascotaDetails.getEmoji());
            mascota.setFechaNacimiento(mascotaDetails.getFechaNacimiento());
            mascota.setCliente(mascotaDetails.getCliente());
            mascota.setAlergias(mascotaDetails.getAlergias());
            mascota.setNotasClinicas(mascotaDetails.getNotasClinicas());
            mascota.setEstado(mascotaDetails.getEstado());
            Mascota actualizada = mascotaRepository.save(mascota);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return mascotaRepository.findById(id).map(mascota -> {
            mascota.setEstado("Inactivo");
            mascotaRepository.save(mascota);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/vacunas")
    public List<MascotaVacuna> obtenerVacunas(@PathVariable Long id) {
        return mascotaVacunaRepository.findByMascotaId(id);
    }

    @PostMapping("/{id}/vacunas")
    public MascotaVacuna registrarVacuna(@PathVariable Long id, @RequestBody MascotaVacuna mascotaVacuna) {
        return mascotaRepository.findById(id).map(mascota -> {
            mascotaVacuna.setMascota(mascota);
            return mascotaVacunaRepository.save(mascotaVacuna);
        }).orElseThrow(() -> new IllegalArgumentException("Mascota no encontrada"));
    }

    @GetMapping("/{id}/consultas")
    public List<Consulta> obtenerConsultas(@PathVariable Long id) {
        return consultaRepository.findByMascotaIdOrderByFechaDesc(id);
    }

    // ==========================================
    // ENDPOINTS DE EVOLUCIÓN (PESO / TEMPERATURA)
    // ==========================================
    @GetMapping("/{id}/evolucion")
    public List<Evolucion> obtenerEvolucion(@PathVariable Long id) {
        return evolucionRepository.findByMascotaIdOrderByFechaDesc(id);
    }

    @PostMapping("/{id}/evolucion")
    public Evolucion registrarEvolucion(@PathVariable Long id, @RequestBody Evolucion evolucion) {
        return mascotaRepository.findById(id).map(mascota -> {
            evolucion.setMascota(mascota);
            Evolucion saved = evolucionRepository.save(evolucion);
            
            // Sincronizar el peso de la mascota con la última medición
            mascota.setPeso(evolucion.getPeso());
            mascotaRepository.save(mascota);
            
            return saved;
        }).orElseThrow(() -> new IllegalArgumentException("Mascota no encontrada"));
    }

    // ==========================================
    // ENDPOINTS DE DOCUMENTOS CLÍNICOS
    // ==========================================
    @GetMapping("/{id}/documentos")
    public List<Documento> obtenerDocumentos(@PathVariable Long id) {
        return documentoRepository.findByMascotaIdOrderByIdDesc(id);
    }

    @PostMapping("/{id}/documentos")
    public Documento registrarDocumento(@PathVariable Long id, @RequestBody Documento documento) {
        return mascotaRepository.findById(id).map(mascota -> {
            documento.setMascota(mascota);
            return documentoRepository.save(documento);
        }).orElseThrow(() -> new IllegalArgumentException("Mascota no encontrada"));
    }

    @DeleteMapping("/documentos/{docId}")
    public ResponseEntity<Void> eliminarDocumento(@PathVariable Long docId) {
        return documentoRepository.findById(docId).map(doc -> {
            documentoRepository.delete(doc);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}