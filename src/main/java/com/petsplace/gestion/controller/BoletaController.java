package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Boleta;
import com.petsplace.gestion.model.BoletaDetalle;
import com.petsplace.gestion.repository.BoletaRepository;
import com.petsplace.gestion.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/boletas")
@CrossOrigin(origins = "*")
public class BoletaController {

    @Autowired
    private BoletaRepository boletaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping
    public List<Boleta> listarTodas() {
        return boletaRepository.findAllWithDetallesOrderByFechaDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Boleta> obtenerPorId(@PathVariable Long id) {
        return boletaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Boleta crear(@RequestBody Boleta boleta) {
        if (boleta.getFecha() == null) {
            boleta.setFecha(LocalDateTime.now());
        }
        if (boleta.getDetalles() != null) {
            for (BoletaDetalle detalle : boleta.getDetalles()) {
                detalle.setBoleta(boleta);

                // Descontar del stock del producto si no es tipo Servicio
                if (detalle.getProductoId() != null) {
                    productoRepository.findById(detalle.getProductoId()).ifPresent(producto -> {
                        if (!"Servicio".equalsIgnoreCase(producto.getCategoria())) {
                            int nuevoStock = Math.max(0, producto.getStock() - detalle.getCantidad());
                            producto.setStock(nuevoStock);
                            productoRepository.save(producto);
                        }
                    });
                }
            }
        }
        return boletaRepository.save(boleta);
    }

    @PutMapping("/{id}/anular")
    public ResponseEntity<Boleta> anular(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return boletaRepository.findById(id).map(boleta -> {
            // Restaurar stock solo si cambia el estado a Anulada
            if (!"Anulada".equalsIgnoreCase(boleta.getEstado())) {
                boleta.setEstado("Anulada");
                boleta.setAnulacionMotivo(payload.get("motivo"));

                if (boleta.getDetalles() != null) {
                    for (BoletaDetalle detalle : boleta.getDetalles()) {
                        if (detalle.getProductoId() != null) {
                            productoRepository.findById(detalle.getProductoId()).ifPresent(producto -> {
                                if (!"Servicio".equalsIgnoreCase(producto.getCategoria())) {
                                    producto.setStock(producto.getStock() + detalle.getCantidad());
                                    productoRepository.save(producto);
                                }
                            });
                        }
                    }
                }
            }
            Boleta actualizada = boletaRepository.save(boleta);
            return ResponseEntity.ok(actualizada);
        }).orElse(ResponseEntity.notFound().build());
    }
}