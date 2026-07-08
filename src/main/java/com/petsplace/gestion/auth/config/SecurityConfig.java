package com.petsplace.gestion.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    // Constructor público con parámetros diferenciados para evitar advertencias de
    // shadowing en el linter
    public SecurityConfig(JwtAuthFilter jwtAuthFilterParam,
            UserDetailsService userDetailsServiceParam,
            JwtAuthEntryPoint jwtAuthEntryPointParam,
            JwtAccessDeniedHandler jwtAccessDeniedHandlerParam) {
        this.jwtAuthFilter = jwtAuthFilterParam;
        this.userDetailsService = userDetailsServiceParam;
        this.jwtAuthEntryPoint = jwtAuthEntryPointParam;
        this.jwtAccessDeniedHandler = jwtAccessDeniedHandlerParam;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationProvider authProviderBean)
            throws Exception {
        http
                // 1. Desactivamos CSRF porque las APIs REST con tokens JWT son inmunes a este
                // ataque
                .csrf(csrf -> csrf.disable())

                // 2. Manejo de excepciones controlado por nuestro EntryPoint y AccessDeniedHandler personalizados
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(this.jwtAuthEntryPoint)
                        .accessDeniedHandler(this.jwtAccessDeniedHandler))

                // 3. Reglas de autorización de las URLs de Petsplace
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/register").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/v1/usuarios", "/api/v1/usuarios/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .requestMatchers("/api/v1/auditoria", "/api/v1/auditoria/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/configuraciones", "/api/v1/configuraciones/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/productos", "/api/v1/productos/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/v1/productos/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/v1/productos/**").hasAnyRole("ADMIN", "ADMINISTRACIÓN", "ADMINISTRACION", "ADMINISTRADOR")
                        .anyRequest().authenticated()
                )
                // 4. Política de sesión SIN ESTADO (Stateless)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 5. Configuramos los proveedores de autenticación tradicionales
                .authenticationProvider(authProviderBean)

                // 6. Enganchamos nuestro filtro de JWT antes del filtro de login por defecto de
                // Spring
                .addFilterBefore(this.jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @SuppressWarnings("deprecation")
    @Bean
    public AuthenticationProvider authenticationProvider(PasswordEncoder encoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(this.userDetailsService);
        authProvider.setPasswordEncoder(encoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // El codificador seguro que hashea las contraseñas en Supabase
    }
}
