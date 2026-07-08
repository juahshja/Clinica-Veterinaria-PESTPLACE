package com.petsplace.gestion.auth.service;

import com.petsplace.gestion.auth.dto.LoginRequest;
import com.petsplace.gestion.auth.dto.LoginResponse;
import com.petsplace.gestion.auth.dto.RegisterRequest;
import com.petsplace.gestion.auth.model.Rol;
import com.petsplace.gestion.auth.model.Usuario;
import com.petsplace.gestion.auth.repository.RolRepository;
import com.petsplace.gestion.auth.repository.UsuarioRepository;
import com.petsplace.gestion.auth.exception.AuthException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    public String registrar(RegisterRequest request) {
        // 1. Validar que el correo no se encuentre duplicado
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AuthException("El correo ya está registrado en el sistema");
        }

        // 2. Obtener el rol correspondiente desde el repositorio por su nombre
        if (request.getRol() == null || request.getRol().trim().isEmpty()) {
            throw new AuthException("El campo 'rol' es obligatorio");
        }
        String nombreRol = request.getRol().trim();
        Rol rol = rolRepository.findByNombreIgnoreCase(nombreRol)
                .orElseThrow(() -> new AuthException("El Rol seleccionado no es válido: " + nombreRol));

        // 3. Mapear los datos al modelo real e instanciar el nuevo registro
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());

        // Cifrado de contraseña obligatorio por seguridad antes de almacenar en BD
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(rol);

        usuarioRepository.save(usuario);
        return "Usuario registrado exitosamente en Petsplace";
    }

    public LoginResponse login(LoginRequest request) {
        // 1. Solicitar a Spring Security la verificación de las credenciales en texto
        // plano vs hash cifrado
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // 2. Si las credenciales coinciden, recuperamos el perfil completo del usuario
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Usuario no encontrado"));

        // 3. Instanciar las autoridades básicas para el generador de tokens
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(usuario.getEmail())
                .password(usuario.getPassword())
                .authorities("ROLE_" + usuario.getRol().getNombre().toUpperCase())
                .build();

        // 4. Emitir el token firmado digitalmente
        String token = jwtService.generateToken(userDetails, usuario.getNombre(), usuario.getRol().getNombre());

        // 5. Retornar los datos limpios encapsulados en el DTO de respuesta
        return new LoginResponse(usuario.getId(), token, usuario.getEmail(), usuario.getNombre(),
                usuario.getRol().getNombre());
    }
}