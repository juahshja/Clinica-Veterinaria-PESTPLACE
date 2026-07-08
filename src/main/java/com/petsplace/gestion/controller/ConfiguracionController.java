package com.petsplace.gestion.controller;

import com.petsplace.gestion.model.Configuracion;
import com.petsplace.gestion.repository.ConfiguracionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/configuraciones")
@CrossOrigin(origins = "*")
public class ConfiguracionController {

    @Autowired
    private ConfiguracionRepository configuracionRepository;

    @GetMapping
    public Map<String, String> obtenerTodas() {
        Map<String, String> configMap = new HashMap<>();
        for (Configuracion c : configuracionRepository.findAll()) {
            configMap.put(c.getClave(), c.getValor());
        }
        return configMap;
    }

    @PostMapping
    public Map<String, String> guardar(@RequestBody Map<String, String> payload) {
        for (Map.Entry<String, String> entry : payload.entrySet()) {
            Configuracion config = new Configuracion(entry.getKey(), entry.getValue());
            configuracionRepository.save(config);
        }
        return obtenerTodas();
    }
}
