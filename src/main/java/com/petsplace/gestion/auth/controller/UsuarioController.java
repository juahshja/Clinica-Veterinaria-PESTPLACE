package com.petsplace.gestion.auth.controller;

import com.petsplace.gestion.auth.model.Rol;
import com.petsplace.gestion.auth.model.Usuario;
import com.petsplace.gestion.auth.repository.RolRepository;
import com.petsplace.gestion.auth.repository.UsuarioRepository;
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
            String confirmPassword = payload.get("confirmPassword");
            if (confirmPassword == null || confirmPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Debe ingresar la contraseña de ese usuario para autorizar los cambios"));
            }
            if (!passwordEncoder.matches(confirmPassword, usuario.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña de confirmación ingresada es incorrecta"));
            }

            String nombre = payload.get("nombre");
            String email = payload.get("email");
            String password = payload.get("password");
            String nombreRol = payload.get("rol");

            if (nombre != null) usuario.setNombre(nombre);
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(usuario -> {
            usuarioRepository.delete(usuario);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
