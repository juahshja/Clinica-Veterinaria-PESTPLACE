# 🐾 INFORME DE INGENIERÍA DE SOFTWARE: SISTEMA PETSPLACE
## SISTEMA INTEGRAL DE PLANIFICACIÓN, HISTORIAL CLÍNICO Y FACTURACIÓN POS PARA CLÍNICAS VETERINARIAS
---
**DOCUMENTO DE SUSTENTACIÓN DE TESIS / PROYECTO DE FIN DE CARRERA**  
**Nivel Académico:** Profesional / Ingeniería  
**Patrón Arquitectónico:** Arquitectura Multicapa Desacoplada (API REST / Stateless JWT)  
**Tecnologías:** Spring Boot 3.5 (Java 17) • React 19 • Vite 8 • Tailwind CSS v4 • Supabase Cloud  

---

## 📄 FICHA TÉCNICA DEL PROYECTO

| Parámetro | Especificación Técnica |
| :--- | :--- |
| **Nombre Comercial** | PetsPlace (Clínica Veterinaria PESTPLACE) |
| **Arquitectura** | Cliente-Servidor Desacoplada (Frontend SPA + Backend RESTful API) |
| **Backend Framework** | Spring Boot 3.5.15-SNAPSHOT / Java 17 |
| **Seguridad** | Spring Security & JWT (JSON Web Tokens) mediante io.jsonwebtoken |
| **Persistencia / ORM** | Hibernate 6 / Spring Data JPA |
| **Base de Datos** | PostgreSQL (Alojado en Supabase Cloud con soporte Pooler IPv4) |
| **Frontend Stack** | React 19.2 • Vite 8.0 • Axios • Bulma CSS • Tailwind CSS v4 |
| **Enrutamiento** | React Router DOM v7 (Manejo de Guards y Sesión Stateless) |
| **Auditoría** | Bitácora forense de operaciones dual (LocalStorage + Base de Datos Centralizada) |

---

## 1. CAPÍTULO I: INTRODUCCIÓN Y METODOLOGÍA

### 1.1. Formulación del Problema
En los centros de salud veterinaria tradicionales, la descentralización de los expedientes médicos (frecuentemente almacenados de forma física o en archivos planos locales) y el nulo control sobre la facturación de servicios y medicamentos provocan dos problemas críticos:
1.  **Ineficiencia en la Atención:** Pérdida de tiempo en la búsqueda de constantes fisiológicas del paciente (curvas de peso, vacunas anteriores) o pérdida de información de ecografías/radiografías.
2.  **Fuga de Inventario y Fraude:** Imposibilidad de conciliar en tiempo real los medicamentos recomendados por los veterinarios en consulta con lo efectivamente cobrado en caja.
3.  **Falta de Trazabilidad:** Inexistencia de registros forenses que permitan auditar qué usuario eliminó o modificó registros médicos, compras o cuentas de acceso.

### 1.2. Solución Propuesta: PetsPlace
PetsPlace automatiza los procesos del negocio mediante tres grandes pilares funcionales:
*   **Expediente Clínico Digital Multimedial:** Seguimiento de vacunas aplicadas y refuerzos, evolución cronológica de constantes (peso y temperatura) e historial de documentos médicos adjuntos (radiografías/análisis en Base64).
*   **Punto de Venta POS Sincronizado:** Módulo de caja dinámico que recupera "cargos médicos pendientes" originados automáticamente en la consulta para evitar pérdidas de facturación, descontando stock físico del inventario con control de transacciones concurrentes.
*   **Seguridad Forense:** Control estricto de acceso basado en roles (RBAC) y bitácora de auditoría en la nube que recopila fecha, usuario, rol, IP, categoría, acción y detalles técnicos de la operación.

### 1.3. Metodología de Desarrollo
El proyecto fue construido bajo la metodología ágil **Scrum**, permitiendo iteraciones funcionales (Sprints) para refinar los requerimientos. En el modelado del software se aplicaron las mejores prácticas de la ingeniería:
*   **Separación de Responsabilidades:** Capas lógicas claramente diferenciadas (Controladores REST, Capa de Servicios, Repositorio JPA, Entidades y DTOs).
*   **Clean Code:** Minimización de código repetitivo mediante el uso de anotaciones **Lombok** (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`).
*   **Resiliencia Híbrida:** Mecanismos de contingencia local (LocalStorage) en el cliente en caso de pérdida de conexión del servidor.

---

## 2. CAPÍTULO II: ARQUITECTURA DE SOFTWARE Y PATRONES DE DISEÑO

### 2.1. Arquitectura Lógica Multicapa (N-Tier)

El software divide su lógica de negocio en capas bien definidas en el backend para facilitar el mantenimiento y la escalabilidad del sistema:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Frontend (SPA) - React 19 + Vite                     │
├─────────────────────────────────────────────────────────────────────────┤
│    [Views/Pages] ──> [Context / Auth] ──> [Axios Interceptor + JWT]    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Petición REST / HTTP Bearer)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Backend REST API - Spring Boot 3.5                   │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Capa de Seguridad:                                                  │
│     CorsFilter ──> JwtAuthFilter ──> SecurityFilterChain                │
│                                                                         │
│  2. Capa de Presentación (Controladores):                               │
│     @RestController (Filtra payloads, mapea rutas, gestiona DTOs)       │
│                                                                         │
│  3. Capa de Negocio (Servicios):                                        │
│     @Service (Lógica de autenticación, hash de claves, reglas de negocio)│
│                                                                         │
│  4. Capa de Datos (ORM / JPA):                                          │
│     @Repository (Abstracción JDBC, transacciones locales, Hibernate)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (JDBC / Pooler)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Base de Datos - PostgreSQL                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Patrones de Diseño Implementados
1.  **MVC (Model-View-Controller) / RESTful:** Los controladores del backend manejan el protocolo HTTP y retornan recursos en formato JSON estándar, actuando como interfaz de comunicación para el frontend.
2.  **Repository (DAO):** Implementado mediante interfaces que extienden de `JpaRepository`. Permite realizar consultas CRUD sin escribir SQL manual, protegiendo al sistema de inyección de código SQL.
3.  **Data Transfer Object (DTO):** Utilizado en el módulo de seguridad (`LoginRequest`, `RegisterRequest`, `LoginResponse`) para aislar los modelos internos de base de datos de las interfaces de red de la API.
4.  **Interceptor / Filter Chain:** El `JwtAuthFilter` intercepta de manera secuencial cada llamada HTTP entrante para extraer el JWT y verificar su firma antes de conceder acceso al controlador.
5.  **Singleton (State Management):** El `AuthContext` en el frontend maneja el estado único de la sesión y lo propaga a lo largo de todo el árbol de componentes.

### 2.3. Diagrama de Secuencia: Login y Autenticación JWT

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant ReactClient as Frontend (React)
    participant JwtFilter as JwtAuthFilter (Spring)
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant UserRepo as UsuarioRepository
    participant JwtService as JwtService
    participant DB as PostgreSQL (Supabase)

    Usuario->>ReactClient: Ingresa correo y contraseña
    ReactClient->>AuthCtrl: POST /api/v1/auth/login (LoginRequest JSON)
    Note over JwtFilter: La ruta /auth/login está configurada como .permitAll()
    JwtFilter->>AuthCtrl: Deja pasar petición sin validar token
    AuthCtrl->>AuthService: login(LoginRequest)
    AuthService->>UserRepo: findByEmail(email)
    UserRepo->>DB: SELECT * FROM usuarios WHERE email = ?
    DB-->>UserRepo: Registro de Usuario (con contraseña cifrada en BCrypt)
    UserRepo-->>AuthService: Objeto Usuario
    Note over AuthService: Compara contraseña plana con hash usando PasswordEncoder.matches()
    AuthService->>JwtService: generateToken(UserDetails, Nombre, Rol)
    Note over JwtService: Genera payload y firma con llave secreta HS256
    JwtService-->>AuthService: Token firmado (String)
    AuthService-->>AuthCtrl: LoginResponse (id, token, email, nombre, rol)
    AuthCtrl-->>ReactClient: HTTP 200 OK + JSON Response
    ReactClient->>ReactClient: Almacena token en sessionStorage
    ReactClient-->>Usuario: Muestra Dashboard del Sistema
```

---

## 3. CAPÍTULO III: MODELADO DE DATOS Y RELACIONES JPA

El esquema relacional fue optimizado para evitar consultas circulares y optimizar la persistencia. Las tablas y entidades cuentan con anotaciones de JPA Hibernate.

### 3.1. Mitigación de Recursividad Cíclica (Ciclos de Jackson)
> [!IMPORTANT]
> Un problema típico al usar relaciones bidireccionales `@OneToMany` y `@ManyToOne` en APIs de Spring Boot es que, al serializar el objeto a JSON, Jackson entra en un bucle infinito que causa un error de desbordamiento de pila (`StackOverflowError`).
> En PetsPlace, esto se solucionó con el uso estratégico de anotaciones bidireccionales de Jackson:
> *   `@JsonManagedReference` en la entidad padre (ej: [Boleta.java](file:///c:/Users/kenny/Desktop/PetPlace/Clinica-Veterinaria-PESTPLACE/src/main/java/com/petsplace/gestion/model/Boleta.java) sobre la lista de detalles) indica que este es el campo principal a serializar.
> *   `@JsonBackReference` en la entidad hija (ej: [BoletaDetalle.java](file:///c:/Users/kenny/Desktop/PetPlace/Clinica-Veterinaria-PESTPLACE/src/main/java/com/petsplace/gestion/model/BoletaDetalle.java) sobre el objeto Boleta) le indica a Jackson que no serialice la referencia de retorno, rompiendo el ciclo recursivo.

---

### 3.2. Diccionario de Datos Extendido

#### Tabla: `roles`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental (IDENTITY)
*   **nombre:** `VARCHAR(50)` | UNIQUE | NOT NULL - Define el nivel de acceso (ej. `ADMIN`, `VETERINARIO`, `PERSONAL DE ATENCIÓN`).

#### Tabla: `usuarios`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nombre:** `VARCHAR(100)` | NOT NULL - Nombre del operador.
*   **email:** `VARCHAR(100)` | UNIQUE | NOT NULL - Correo de credenciales.
*   **password:** `VARCHAR(255)` | NOT NULL - Hash encriptado de la contraseña (BCrypt).
*   **rol_id:** `BIGINT` | FOREIGN KEY a `roles(id)` | NOT NULL
*   **fecha_creacion:** `TIMESTAMP` | NOT NULL | Default: `CURRENT_TIMESTAMP`

#### Tabla: `auditoria`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **fecha:** `TIMESTAMP` | NOT NULL | Default: `CURRENT_TIMESTAMP`
*   **usuario:** `VARCHAR(100)` | NOT NULL - Email del usuario que realiza la acción.
*   **rol:** `VARCHAR(50)` | NOT NULL - Rol asignado.
*   **categoria:** `VARCHAR(50)` | NOT NULL - Módulo (`VENTAS`, `CLÍNICA`, `SISTEMA`).
*   **accion:** `VARCHAR(100)` | NOT NULL - Acción corta (ej. `Emisión de Boleta de Venta`).
*   **detalles:** `TEXT` | NOT NULL - Descripción técnica completa (ej. DNI del dueño, items cobrados, etc.).
*   **ip:** `VARCHAR(45)` | Default: `127.0.0.1` - IP del cliente.
*   **estado:** `VARCHAR(20)` | Default: `ÉXITO`

#### Tabla: `clientes`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nombre:** `VARCHAR(150)` | NOT NULL - Nombre completo del dueño.
*   **dni:** `VARCHAR(20)` | UNIQUE | NOT NULL - Documento de identidad fiscal.
*   **telefono:** `VARCHAR(20)` | NULLABLE
*   **email:** `VARCHAR(100)` | NULLABLE
*   **direccion:** `VARCHAR(255)` | NULLABLE

#### Tabla: `mascotas`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nombre:** `VARCHAR(100)` | NOT NULL
*   **especie:** `VARCHAR(50)` | NOT NULL (ej: `Perro`, `Gato`)
*   **raza:** `VARCHAR(100)` | NULLABLE
*   **sexo:** `VARCHAR(20)` | NULLABLE (`Macho` o `Hembra`)
*   **edad:** `INTEGER` | NULLABLE
*   **peso:** `DOUBLE PRECISION` | NULLABLE - Último peso del paciente.
*   **color:** `VARCHAR(50)` | NULLABLE
*   **emoji:** `VARCHAR(50)` | NULLABLE - Usado para renderizar el icono en el frontend.
*   **fecha_nacimiento:** `DATE` | NULLABLE
*   **cliente_id:** `BIGINT` | FOREIGN KEY a `clientes(id)` | NOT NULL
*   **alergias:** `TEXT` | NULLABLE - Historial de alergias del paciente.
*   **notas_clinicas:** `TEXT` | NULLABLE - Cuidados críticos.
*   **estado:** `VARCHAR(50)` | Default: `Activo` - Control lógico de baja/baja temporal.

#### Tabla: `vacunas`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nombre:** `VARCHAR(100)` | NOT NULL
*   **especie_destino:** `VARCHAR(50)` | NULLABLE - Especie para la que fue formulada.
*   **dosis:** `VARCHAR(50)` | NULLABLE
*   **dias_refuerzo:** `INTEGER` | NULLABLE - Período para programar la alerta de refuerzo.
*   **descripcion:** `TEXT` | NULLABLE

#### Tabla: `mascotas_vacunas`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **mascota_id:** `BIGINT` | FOREIGN KEY a `mascotas(id)` | NOT NULL
*   **vacuna_id:** `BIGINT` | FOREIGN KEY a `vacunas(id)` | NOT NULL
*   **fecha_aplicacion:** `DATE` | NOT NULL
*   **fecha_siguiente:** `DATE` | NULLABLE - Fecha programada de refuerzo calculado.
*   **estado:** `VARCHAR(50)` | Default: `Aplicada`

#### Tabla: `consultas`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **mascota_id:** `BIGINT` | FOREIGN KEY a `mascotas(id)` | NOT NULL
*   **motivo:** `VARCHAR(255)` | NOT NULL
*   **diagnostico:** `TEXT` | NULLABLE
*   **tratamiento:** `TEXT` | NULLABLE
*   **medicamentos:** `TEXT` | NULLABLE - Fórmulas recomendadas.
*   **fecha:** `TIMESTAMP` | NOT NULL | Default: `CURRENT_TIMESTAMP`
*   **costo:** `DOUBLE PRECISION` | NULLABLE - Costo a liquidar en caja.
*   **veterinario:** `VARCHAR(100)` | NULLABLE

#### Tabla: `evoluciones`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **mascota_id:** `BIGINT` | FOREIGN KEY a `mascotas(id)` | NOT NULL
*   **fecha:** `DATE` | NOT NULL - Fecha del control físico.
*   **peso:** `DOUBLE PRECISION` | NOT NULL - Peso exacto capturado.
*   **temperatura:** `VARCHAR(20)` | NULLABLE (ej: `39.1°C`)
*   **notas:** `TEXT` | NULLABLE

#### Tabla: `documentos`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **mascota_id:** `BIGINT` | FOREIGN KEY a `mascotas(id)` | NOT NULL
*   **nombre:** `VARCHAR(255)` | NOT NULL - Nombre descriptivo.
*   **tamaño:** `VARCHAR(50)` | NULLABLE
*   **fecha:** `DATE` | NOT NULL
*   **descripcion:** `TEXT` | NULLABLE
*   **file_data:** `TEXT` | NOT NULL - Archivo codificado en formato de texto plano Base64.

#### Tabla: `productos`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nombre:** `VARCHAR(255)` | NOT NULL
*   **sku:** `VARCHAR(100)` | UNIQUE | NOT NULL - Código único para inventario.
*   **stock:** `INTEGER` | NOT NULL - Stock físico (se actualiza automáticamente tras ventas/anulaciones).
*   **precio:** `DOUBLE PRECISION` | NOT NULL - Precio unitario de cara al público.
*   **categoria:** `VARCHAR(100)` | NULLABLE (ej: `Alimento`, `Medicamento`, `Servicio`).
*   **emoji:** `VARCHAR(50)` | NULLABLE

#### Tabla: `boletas`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **nro_boleta:** `VARCHAR(50)` | UNIQUE | NOT NULL - Correlativo de cobros (ej. `BOL-00001`).
*   **fecha:** `TIMESTAMP` | NOT NULL
*   **cliente_nombre:** `VARCHAR(150)` | NULLABLE
*   **cliente_dni:** `VARCHAR(20)` | NULLABLE
*   **mascota_nombre:** `VARCHAR(100)` | NULLABLE
*   **metodo_pago:** `VARCHAR(50)` | NULLABLE (ej. `Efectivo`, `Tarjeta`)
*   **cajero:** `VARCHAR(100)` | NULLABLE - Email del cajero autorizador.
*   **estado:** `VARCHAR(50)` | Default: `Activa` (Valores: `Activa` o `Anulada`).
*   **anulacion_motivo:** `VARCHAR(255)` | NULLABLE - Requerido al realizar la anulación.
*   **total:** `DOUBLE PRECISION` | NOT NULL - Suma consolidada de la boleta.

#### Tabla: `boleta_detalles`
*   **id:** `BIGINT` | PRIMARY KEY | Autoincremental
*   **boleta_id:** `BIGINT` | FOREIGN KEY a `boletas(id)` con eliminación en cascada (`CascadeType.ALL`) | NOT NULL
*   **producto_id:** `BIGINT` | NOT NULL - Referencia histórica del producto vendido.
*   **producto_nombre:** `VARCHAR(150)` | NOT NULL - Copia del nombre para mantener el histórico.
*   **cantidad:** `INTEGER` | NOT NULL
*   **precio_unitario:** `DOUBLE PRECISION` | NOT NULL
*   **subtotal:** `DOUBLE PRECISION` | NOT NULL - Calculado como `cantidad * precio_unitario`.

#### Tabla: `configuraciones`
*   **clave:** `VARCHAR(100)` | PRIMARY KEY
*   **valor:** `TEXT` | NULLABLE - Guarda parámetros globales del negocio.

---

## 4. CAPÍTULO IV: CATÁLOGO Y PAYLOADS DE LA API REST (EJEMPLOS REALES)

Para facilitar la sustentación ante el jurado, se presentan a continuación los payloads JSON reales (solicitud y respuesta) de los flujos más complejos del sistema.

### 4.1. Flujo de Login (`POST /api/v1/auth/login`)

**Petición (JSON Request Body):**
```json
{
  "email": "admin@petplace.com",
  "password": "admin123"
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "id": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBwZXRwbGFjZS5jb20iLCJub21icmUiOiJBZG1pbiIsImNvbXBhbnkiOiJQZXRzUGxhY2UiLCJyb2wiOiJBRE1JTiIsImlhdCI6MTcyMDQyMzEyMywiZXhwIjoxNzIwNTA5NTIzfQ.exampleSignature",
  "email": "admin@petplace.com",
  "nombre": "Admin",
  "rol": "ADMIN"
}
```

---

### 4.2. Creación de una Cita (`POST /api/v1/citas`)

**Petición (JSON Request Body):**
```json
{
  "mascota": {
    "id": 2
  },
  "fecha": "2026-07-15",
  "hora": "10:30",
  "motivo": "Revisión mensual y corte de garras",
  "veterinario": "Dr. Fernando Torres",
  "estado": "Pendiente"
}
```

**Respuesta Exitosa (HTTP 200 OK / 201 Created):**
```json
{
  "id": 5,
  "mascota": {
    "id": 2,
    "nombre": "Bruno",
    "especie": "Perro",
    "raza": "Schnauzer",
    "sexo": "Macho",
    "cliente": {
      "id": 1,
      "nombre": "Juan Pérez",
      "dni": "72091234"
    }
  },
  "fecha": "2026-07-15",
  "hora": "10:30",
  "motivo": "Revisión mensual y corte de garras",
  "veterinario": "Dr. Fernando Torres",
  "estado": "Pendiente"
}
```

---

### 4.3. Flujo POS: Creación de Venta y Descuento de Stock (`POST /api/v1/boletas`)

Este endpoint recibe la cabecera y el detalle de la venta, guardándolos en base de datos y descontando el stock disponible del catálogo.

**Petición (JSON Request Body):**
```json
{
  "nroBoleta": "BOL-000045",
  "clienteNombre": "Juan Pérez",
  "clienteDni": "72091234",
  "mascotaNombre": "Bruno",
  "metodoPago": "Efectivo",
  "cajero": "admin@petplace.com",
  "estado": "Activa",
  "total": 158.00,
  "detalles": [
    {
      "productoId": 1,
      "productoNombre": "Comida de Perro Premium 15kg",
      "cantidad": 1,
      "precioUnitario": 120.00,
      "subtotal": 120.00
    },
    {
      "productoId": 3,
      "productoNombre": "Pipeta Antiparasitaria Perro Mediano",
      "cantidad": 1,
      "precioUnitario": 38.00,
      "subtotal": 38.00
    }
  ]
}
```

**Respuesta Exitosa (HTTP 200 OK):**
```json
{
  "id": 12,
  "nroBoleta": "BOL-000045",
  "fecha": "2026-07-08T02:29:45.312",
  "clienteNombre": "Juan Pérez",
  "clienteDni": "72091234",
  "mascotaNombre": "Bruno",
  "metodoPago": "Efectivo",
  "cajero": "admin@petplace.com",
  "estado": "Activa",
  "total": 158.00,
  "detalles": [
    {
      "id": 23,
      "productoId": 1,
      "productoNombre": "Comida de Perro Premium 15kg",
      "cantidad": 1,
      "precioUnitario": 120.00,
      "subtotal": 120.00
    },
    {
      "id": 24,
      "productoId": 3,
      "productoNombre": "Pipeta Antiparasitaria Perro Mediano",
      "cantidad": 1,
      "precioUnitario": 38.00,
      "subtotal": 38.00
    }
  ]
}
```

---

## 5. CAPÍTULO V: ANÁLISIS DE INTEGRACIONES CLAVE Y FLUJOS LÓGICOS

### 5.1. Mecanismo de re-autenticación antes de editar perfiles
Un control crítico de seguridad se encuentra implementado en el controlador de usuarios [UsuarioController.java](file:///c:/Users/kenny/Desktop/PetPlace/Clinica-Veterinaria-PESTPLACE/src/main/java/com/petsplace/gestion/auth/controller/UsuarioController.java). Al editar el perfil de un usuario, el backend exige que se envíe la contraseña actual del usuario que está siendo modificado bajo la propiedad `confirmPassword`. 
*   El backend usa `passwordEncoder.matches(confirmPassword, usuario.getPassword())` para validar la autenticidad antes de persistir cualquier cambio (como cambiar su email o subir sus privilegios de rol).
*   Si la contraseña de confirmación es incorrecta o está ausente, el backend bloquea la actualización y retorna un código `HTTP 400 Bad Request` con un mensaje descriptivo.

### 5.2. Conciliación y Sincronización Automática de Constantes Médicas
Para asegurar la coherencia de la información clínica, la aplicación implementa una regla de sincronización automática en el registro de evoluciones del paciente:
*   Al registrar una nueva evolución física mediante `POST /api/v1/mascotas/{id}/evolucion`, el sistema inserta el registro histórico en la tabla `evoluciones`.
*   Inmediatamente después, el backend recupera la entidad `Mascota` vinculada y sobrescribe su propiedad general `peso` con el valor recién ingresado.
*   Esto asegura que la ficha general de la mascota siempre muestre el peso actualizado en tiempo real sin necesidad de que el veterinario edite la ficha del paciente manualmente.

---

## 6. CAPÍTULO VI: GUÍA DE DESPLIEGUE, CONFIGURACIÓN Y SOLUCIÓN DE PROBLEMAS

### 6.1. Configuración de Base de Datos (Pooler de Supabase)
El archivo `application.properties` está configurado por defecto para apuntar al pooler transaccional de Supabase en el puerto `5432` con `sslmode=require`. Esto garantiza compatibilidad de IPv4 en cualquier proveedor de internet local, evitando problemas de conexión por la ausencia de direccionamiento IPv6 en routers residenciales.

### 6.2. Comandos para la Compilación y Despliegue Local

#### Levantar el Backend (Spring Boot)
1.  Verifique tener Java 17 configurado en su sistema (`java -version`).
2.  Desde la raíz del proyecto, ejecute:
    ```powershell
    mvn clean install
    mvn spring-boot:run
    ```

#### Levantar el Frontend (React / Vite)
1.  Verifique tener Node.js 18 o superior instalado.
2.  Acceda al directorio frontend:
    ```powershell
    cd frontend
    npm install
    npm run dev
    ```

---

### 6.3. Solución de Problemas (Troubleshooting)

#### 1. Conflicto de Puertos (Puerto 8080 en uso)
Si al levantar el backend obtiene el error `Port 8080 was already in use`, puede cambiar el puerto de Spring Boot en `src/main/resources/application.properties` añadiendo la propiedad:
```properties
server.port=9090
```
*(Recuerde actualizar la variable `baseURL` en `frontend/src/services/api.js` o configurar la variable de entorno `VITE_API_URL` al puerto correspondiente).*

#### 2. Error en Carga de Dependencias en Maven
Si experimenta fallos durante `mvn clean install` relacionados con dependencias de plugins o el JDK, ejecute el siguiente comando para forzar la actualización de los paquetes del repositorio local de Maven (`.m2`):
```powershell
mvn clean install -U
```

#### 3. Error CORS (Cross-Origin Resource Sharing)
Los controladores de la aplicación ya incluyen la anotación `@CrossOrigin(origins = "*")`. Si por políticas internas de red del navegador se bloquean solicitudes, verifique que las cabeceras HTTP inyectadas por el interceptor de Axios no alteren los métodos permitidos (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).

---
*PetsPlace representa una solución robusta y unificada diseñada bajo estándares modernos de desarrollo de software, ideal para la sustentación y defensa de un título profesional.*
