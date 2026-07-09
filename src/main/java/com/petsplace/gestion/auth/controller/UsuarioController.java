package com.petsplace.gestion.auth.controller;

import com.petsplace.gestion.auth.model.Rol;
import com.petsplace.gestion.auth.model.Usuario;
import com.petsplace.gestion.auth.repository.RolRepository;
import com.petsplace.gestion.auth.repository.UsuarioRepository;
import com.petsplace.gestion.repository.CitaRepository;
import com.petsplace.gestion.repository.ConsultaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private ConsultaRepository consultaRepository;

    @GetMapping
    public List<Usuario> listarTodos() {
        // Obtenemos los usuarios y podemos limpiar las contraseñas para seguridad en el retorno
        List<Usuario> usuarios = usuarioRepository.findAll();
        usuarios.forEach(u -> u.setPassword("[PROTEGIDO]"));
        return usuarios;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerPorId(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setPassword("[PROTEGIDO]");
                    return ResponseEntity.ok(u);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, String> payload) {
        String nombre = payload.get("nombre");
        String email = payload.get("email");
        String password = payload.get("password");
        String nombreRol = payload.get("rol");

        if (nombre == null || email == null || password == null || nombreRol == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Todos los campos son obligatorios"));
        }

        if (usuarioRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo ya está registrado en el sistema"));
        }

        Rol rol = rolRepository.findByNombreIgnoreCase(nombreRol)
                .orElseThrow(() -> new RuntimeException("Rol no válido: " + nombreRol));

        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setRol(rol);

        Usuario guardado = usuarioRepository.save(usuario);
        guardado.setPassword("[PROTEGIDO]");
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return usuarioRepository.findById(id).map(usuario -> {
            String nombre = payload.get("nombre");
            String email = payload.get("email");
            String password = payload.get("password");
            String nombreRol = payload.get("rol");

            if (nombre != null && !nombre.trim().isEmpty() && !nombre.equalsIgnoreCase(usuario.getNombre())) {
                String antiguoNombre = usuario.getNombre();
                usuario.setNombre(nombre);
                try {
                    citaRepository.actualizarNombreVeterinario(antiguoNombre, nombre);
                    consultaRepository.actualizarNombreVeterinario(antiguoNombre, nombre);
                } catch (Exception e) {
                    System.err.println("Error actualizando nombres de veterinario en cascada: " + e.getMessage());
                }
            }
            if (email != null) {
                // Verificar duplicados si cambia de email
                if (!usuario.getEmail().equalsIgnoreCase(email) && usuarioRepository.findByEmail(email).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "El correo ya está en uso por otro usuario"));
                }
                usuario.setEmail(email);
            }
            if (password != null && !password.trim().isEmpty() && !password.equals("[PROTEGIDO]")) {
                usuario.setPassword(passwordEncoder.encode(password));
            }
            if (nombreRol != null) {
                Rol rol = rolRepository.findByNombreIgnoreCase(nombreRol)
                        .orElseThrow(() -> new RuntimeException("Rol no válido: " + nombreRol));
                usuario.setRol(rol);
            }

            Usuario actualizado = usuarioRepository.save(usuario);
            actualizado.setPassword("[PROTEGIDO]");
            return ResponseEntity.ok(actualizado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/restablecer-password")
    public ResponseEntity<?> restablecerPassword(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(usuario -> {
            String tempPassword = "Pet" + (10000 + new java.util.Random().nextInt(90000));
            usuario.setPassword(passwordEncoder.encode(tempPassword));
            usuarioRepository.save(usuario);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "tempPassword", tempPassword,
                "mensaje", "Contraseña restablecida exitosamente para " + usuario.getNombre()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(usuario -> {
            usuarioRepository.delete(usuario);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
