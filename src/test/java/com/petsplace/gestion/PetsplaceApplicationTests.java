package com.petsplace.gestion;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Rollback;
import com.petsplace.gestion.model.*;
import com.petsplace.gestion.repository.*;
import com.petsplace.gestion.auth.model.Rol;
import com.petsplace.gestion.auth.model.Usuario;
import com.petsplace.gestion.auth.repository.RolRepository;
import com.petsplace.gestion.auth.repository.UsuarioRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@SpringBootTest
class PetsplaceApplicationTests {

	@Autowired private ClienteRepository clienteRepository;
	@Autowired private MascotaRepository mascotaRepository;
	@Autowired private ConsultaRepository consultaRepository;
	@Autowired private VacunaRepository vacunaRepository;
	@Autowired private MascotaVacunaRepository mascotaVacunaRepository;
	@Autowired private BoletaRepository boletaRepository;
	@Autowired private ProductoRepository productoRepository;
	@Autowired private RolRepository rolRepository;
	@Autowired private UsuarioRepository usuarioRepository;

	private final Random random = new Random();

	private static final String[] NOMBRES_MASCULINOS = {
		"Juan", "Carlos", "Luis", "José", "Manuel", "Jorge", "Victor", "César", "Miguel", "Pedro",
		"Julio", "David", "Francisco", "Hugo", "Alejandro", "Ricardo", "Fernando", "Oscar", "Raúl", "Edgar"
	};

	private static final String[] NOMBRES_FEMENINOS = {
		"María", "Ana", "Luisa", "Juana", "Carmen", "Rosa", "Silvia", "Patricia", "Elena", "Isabel",
		"Gisela", "Diana", "Sandra", "Beatriz", "Gabriela", "Karina", "Roxana", "Mónica", "Cecilia", "Verónica"
	};

	private static final String[] APELLIDOS = {
		"Quispe", "Flores", "Sánchez", "García", "Rodríguez", "Rojas", "Huamán", "Mamani", "Vásquez", "Ramos",
		"Chávez", "Torres", "Díaz", "Aguilar", "Mendoza", "Castillo", "Espinoza", "López", "Gomez", "Ortiz",
		"Ruiz", "Morales", "Herrera", "Medina", "Paredes", "Salazar", "Rivera", "Guzmán", "Pérez", "Vargas"
	};

	private static final String[][] DISTRITOS_LIMA = {
		{"Miraflores", "Av. Larco 456"},
		{"San Isidro", "Av. Javier Prado 1024"},
		{"Santiago de Surco", "Calle Las Lomas 789"},
		{"San Borja", "Av. Aviación 2345"},
		{"La Molina", "Jr. El Corregidor 812"},
		{"Jesús María", "Av. Salaverry 1500"},
		{"Lince", "Jr. Canevaro 420"},
		{"Chorrillos", "Av. Defensores del Morro 910"},
		{"Barranco", "Av. Pedro de Osma 180"},
		{"Magdalena del Mar", "Jr. Bolognesi 560"},
		{"Surquillo", "Calle Dante 320"},
		{"Pueblo Libre", "Av. Brasil 1900"}
	};

	private static final String[] NOMBRES_PERROS = {
		"Fido", "Toby", "Bobby", "Rambo", "Rocky", "Max", "Jack", "Bruno", "Coco", "Zeus",
		"Luna", "Lola", "Bella", "Kira", "Nala", "Mia", "Daisy", "Sasha", "Maya", "Linda"
	};

	private static final String[] NOMBRES_GATOS = {
		"Tom", "Felix", "Garfield", "Simba", "Milo", "Oliver", "Loki", "Leo", "Tigger", "Platón",
		"Mimi", "Cleo", "Michi", "Kitty", "Luna", "Bella", "Nala", "Frida", "Masha", "Chloé"
	};

	private static final String[] RAZAS_PERROS = {"Shih Tzu", "Pug", "Golden Retriever", "Pastor Alemán", "Bulldog", "Poodle", "Chihuahua", "Boxer", "Schnauzer", "Común / Mestizo"};
	private static final String[] RAZAS_GATOS = {"Siamés", "Persa", "Angora", "Maine Coon", "Bengala", "Común / Mestizo"};
	private static final String[] COLORES = {"Marrón", "Blanco", "Negro", "Gris", "Bicolor", "Tricolor", "Dorado", "Crema"};

	@Test
	@Transactional
	@Rollback(false)
	void generateMockDemoData() {
		System.out.println("=== GENERATING DEMO DATA FOR THE LAST 2 MONTHS ===");

		// 1. Roles and Users setup
		Rol rolVet = rolRepository.findByNombreIgnoreCase("Veterinario")
				.orElseGet(() -> {
					Rol r = new Rol(null, "Veterinario");
					return rolRepository.save(r);
				});

		Rol rolAdmin = rolRepository.findByNombreIgnoreCase("Administrador")
				.orElseGet(() -> {
					Rol r = new Rol(null, "Administrador");
					return rolRepository.save(r);
				});

		// Create mock veterinarians in table if not exist
		List<Usuario> veterinarians = new ArrayList<>();
		
		Usuario vet1 = usuarioRepository.findByEmail("kenny.vet@petplace.com").orElse(null);
		if (vet1 == null) {
			vet1 = new Usuario(null, "Dr. Kenny Garay", "kenny.vet@petplace.com", "$2a$10$r.2541GgC9o.fXn/e.G.uunfU60r5m8nJqCjZpC/D2x1vI5BqfS9S", rolVet, LocalDateTime.now());
			vet1 = usuarioRepository.save(vet1);
		}
		veterinarians.add(vet1);

		Usuario vet2 = usuarioRepository.findByEmail("gean.vet@petplace.com").orElse(null);
		if (vet2 == null) {
			vet2 = new Usuario(null, "Dr. Gean Carlos Sotelo", "gean.vet@petplace.com", "$2a$10$r.2541GgC9o.fXn/e.G.uunfU60r5m8nJqCjZpC/D2x1vI5BqfS9S", rolVet, LocalDateTime.now());
			vet2 = usuarioRepository.save(vet2);
		}
		veterinarians.add(vet2);

		Usuario vet3 = usuarioRepository.findByEmail("valeria.vet@petplace.com").orElse(null);
		if (vet3 == null) {
			vet3 = new Usuario(null, "Dra. Valeria Mendoza", "valeria.vet@petplace.com", "$2a$10$r.2541GgC9o.fXn/e.G.uunfU60r5m8nJqCjZpC/D2x1vI5BqfS9S", rolVet, LocalDateTime.now());
			vet3 = usuarioRepository.save(vet3);
		}
		veterinarians.add(vet3);

		// 2. Seed Vacunas in catalog if missing
		List<Vacuna> catVacunas = vacunaRepository.findAll();
		if (catVacunas.isEmpty()) {
			catVacunas.add(vacunaRepository.save(new Vacuna(null, "Triple Felina", "Gato", "1 ml", 365, "Protección contra rinotraqueitis, calicivirus y panleucopenia felina.")));
			catVacunas.add(vacunaRepository.save(new Vacuna(null, "Leucemia Felina", "Gato", "1 ml", 365, "Previene la infección por el virus de la leucemia felina.")));
			catVacunas.add(vacunaRepository.save(new Vacuna(null, "Quíntuple Canina", "Perro", "1 ml", 365, "Protección contra moquillo, parvovirus, hepatitis, influenza y leptospira.")));
			catVacunas.add(vacunaRepository.save(new Vacuna(null, "Séxtuple Canina", "Perro", "1 ml", 365, "Inmunización completa contra principales virus caninos.")));
			catVacunas.add(vacunaRepository.save(new Vacuna(null, "Antirrábica", "Todos", "1 ml", 365, "Vacuna obligatoria anual contra la rabia.")));
		}

		// 3. Clean slate for demo tables
		System.out.println("Cleaning old demo transactional data...");
		boletaRepository.deleteAll();
		mascotaVacunaRepository.deleteAll();
		consultaRepository.deleteAll();
		mascotaRepository.deleteAll();
		clienteRepository.deleteAll();

		// 4. Generate 130 Clientes and Mascotas
		List<Cliente> clients = new ArrayList<>();
		List<Mascota> pets = new ArrayList<>();
		Set<String> generatedDnis = new HashSet<>();

		for (int i = 1; i <= 130; i++) {
			// Name generation
			String nombre;
			if (random.nextBoolean()) {
				nombre = NOMBRES_MASCULINOS[random.nextInt(NOMBRES_MASCULINOS.length)] + " " +
						 APELLIDOS[random.nextInt(APELLIDOS.length)] + " " +
						 APELLIDOS[random.nextInt(APELLIDOS.length)];
			} else {
				nombre = NOMBRES_FEMENINOS[random.nextInt(NOMBRES_FEMENINOS.length)] + " " +
						 APELLIDOS[random.nextInt(APELLIDOS.length)] + " " +
						 APELLIDOS[random.nextInt(APELLIDOS.length)];
			}

			// Dni generation
			String dni;
			do {
				dni = String.format("%08d", random.nextInt(90000000) + 10000000);
			} while (generatedDnis.contains(dni));
			generatedDnis.add(dni);

			String telefono = "9" + String.format("%08d", random.nextInt(90000000) + 10000000);
			String email = nombre.toLowerCase().replace(" ", ".") + "@gmail.com";
			String[] distrito = DISTRITOS_LIMA[random.nextInt(DISTRITOS_LIMA.length)];
			String direccion = distrito[1] + ", " + distrito[0];

			Cliente cliente = new Cliente(null, nombre, dni, telefono, email, direccion);
			cliente = clienteRepository.save(cliente);
			clients.add(cliente);

			// Mascota generation
			String especie = random.nextDouble() < 0.6 ? "Perro" : "Gato";
			String petNombre;
			String raza;
			String emoji;
			if (especie.equals("Perro")) {
				petNombre = NOMBRES_PERROS[random.nextInt(NOMBRES_PERROS.length)];
				raza = RAZAS_PERROS[random.nextInt(RAZAS_PERROS.length)];
				emoji = "🐶";
			} else {
				petNombre = NOMBRES_GATOS[random.nextInt(NOMBRES_GATOS.length)];
				raza = RAZAS_GATOS[random.nextInt(RAZAS_GATOS.length)];
				emoji = "🐱";
			}

			String sexo = random.nextBoolean() ? "Macho" : "Hembra";
			Integer edad = random.nextInt(12) + 1;
			Double peso = especie.equals("Perro") ? (random.nextDouble() * 25 + 3) : (random.nextDouble() * 5 + 2.5);
			String color = COLORES[random.nextInt(COLORES.length)];
			LocalDate fechaNacimiento = LocalDate.now().minusYears(edad).minusMonths(random.nextInt(12));

			String alergias = random.nextDouble() < 0.15 ? "Alergia a las pulgas, intolerancia a la lactosa" : "Ninguna";
			String notasClinicas = "Paciente dócil y en buen estado de salud.";

			Mascota mascota = new Mascota(null, petNombre, especie, raza, sexo, edad, peso, color, emoji, fechaNacimiento, cliente, alergias, notasClinicas, "Activo");
			mascota = mascotaRepository.save(mascota);
			pets.add(mascota);
		}

		System.out.println("Se crearon " + clients.size() + " clientes y " + pets.size() + " mascotas.");

		// 5. Generate Consultas (200 consultas) spanning the last 60 days
		String[] motivos = {
			"Chequeo de rutina", "Vacunación anual", "Desparasitación", "Inapetencia", "Control de peso", 
			"Problemas gastrointestinales", "Infección de oído", "Limpieza dental", "Corte de uñas y baño"
		};
		String[] diagnosticos = {
			"Paciente saludable, constantes fisiológicas normales.", 
			"Leve otitis en oído derecho, sin secreción purulenta.",
			"Gastroenteritis leve por cambio alimenticio.", 
			"Sobrepeso grado 1, se recomienda dieta balanceada.",
			"Sarro dental moderado, requiere profilaxis.",
			"Sano. Se procedió a aplicar vacunas programadas."
		};
		String[] tratamientos = {
			"No requiere tratamiento médico inmediato.",
			"Limpieza diaria con Otiflex por 7 días y gotas antibióticas.",
			"Dieta blanda (pollo y arroz sin sal) por 3 días y suero oral.",
			"Reducir porción de alimento un 15% e incrementar caminatas diarias.",
			"Agendar profilaxis dental en la semana.",
			"Reposo relativo por 24 horas posterior a vacunación."
		};
		String[] medicamentosList = {
			"Ninguno",
			"Otiflex Gotas 15ml (Aplicar 3 gotas c/12h)",
			"Floratil 1 cápsula diaria por 5 días, Metronidazol suspensión 5ml c/12h",
			"Hills Perfect Weight Alimento especial",
			"Clorhexidina gel dental",
			"Antipirético si presenta fiebre o malestar"
		};

		List<Consulta> consultas = new ArrayList<>();
		LocalDate startDate = LocalDate.now().minusDays(60);

		for (int i = 0; i < 200; i++) {
			Mascota pet = pets.get(random.nextInt(pets.size()));
			String motivo = motivos[random.nextInt(motivos.length)];
			int idx = random.nextInt(diagnosticos.length);
			String diagnostico = diagnosticos[idx];
			String tratamiento = tratamientos[idx];
			String medicamentos = medicamentosList[idx];

			// Date generation in the last 60 days
			LocalDate date = startDate.plusDays(random.nextInt(60));
			LocalTime time = LocalTime.of(random.nextInt(10) + 9, random.nextInt(60)); // 9 AM to 7 PM
			LocalDateTime fecha = LocalDateTime.of(date, time);

			Double costo = 40.0 + random.nextInt(5) * 10; // S/. 40.00 to S/. 80.00
			Usuario vet = veterinarians.get(random.nextInt(veterinarians.size()));

			Consulta consulta = new Consulta(null, pet, motivo, diagnostico, tratamiento, medicamentos, fecha, costo, vet.getNombre());
			consulta = consultaRepository.save(consulta);
			consultas.add(consulta);
		}
		System.out.println("Se crearon " + consultas.size() + " consultas médicas.");

		// 6. Generate MascotaVacuna (160 vacunas aplicadas)
		List<MascotaVacuna> mascotaVacunas = new ArrayList<>();
		for (int i = 0; i < 160; i++) {
			Mascota pet = pets.get(random.nextInt(pets.size()));
			// Filter vaccines corresponding to pet species
			List<Vacuna> applicable = catVacunas.stream()
					.filter(v -> v.getEspecieDestino().equalsIgnoreCase("Todos") || v.getEspecieDestino().equalsIgnoreCase(pet.getEspecie()))
					.toList();
			
			if (applicable.isEmpty()) continue;

			Vacuna vac = applicable.get(random.nextInt(applicable.size()));
			LocalDate fechaAplicacion = startDate.plusDays(random.nextInt(60));
			LocalDate fechaSiguiente = fechaAplicacion.plusDays(vac.getDiasRefuerzo());

			String estado = "Aplicada";
			if (fechaSiguiente.isBefore(LocalDate.now())) {
				estado = "Vencida";
			} else if (fechaSiguiente.isBefore(LocalDate.now().plusDays(15))) {
				estado = "Pendiente";
			}

			MascotaVacuna mv = new MascotaVacuna(null, pet, vac, fechaAplicacion, fechaSiguiente, estado);
			mv = mascotaVacunaRepository.save(mv);
			mascotaVacunas.add(mv);
		}
		System.out.println("Se aplicaron " + mascotaVacunas.size() + " vacunas a las mascotas.");

		// 7. Generate Boletas and Detalles (240 boletas spanning the last 60 days)
		List<Producto> products = productoRepository.findAll();
		if (products.isEmpty()) {
			System.out.println("No products found! Skipping receipt generation.");
			return;
		}

		String[] metodosPago = {"Efectivo", "Tarjeta", "Yape", "Transferencia"};
		String[] cajeros = {"Kenny Garay", "Gean Carlos Sotelo", "Administrador"};

		int boletaCount = 0;
		for (int i = 1; i <= 240; i++) {
			Mascota pet = pets.get(random.nextInt(pets.size()));
			Cliente cli = pet.getCliente();

			LocalDate bDate = startDate.plusDays(random.nextInt(60));
			LocalTime bTime = LocalTime.of(random.nextInt(10) + 9, random.nextInt(60));
			LocalDateTime fecha = LocalDateTime.of(bDate, bTime);

			String nroBoleta = String.format("BOL-%02d-%06d", bDate.getMonthValue(), i);
			String metodoPago = metodosPago[random.nextInt(metodosPago.length)];
			String cajero = cajeros[random.nextInt(cajeros.length)];

			Boleta boleta = new Boleta();
			boleta.setNroBoleta(nroBoleta);
			boleta.setFecha(fecha);
			boleta.setClienteNombre(cli.getNombre());
			boleta.setClienteDni(cli.getDni());
			boleta.setMascotaNombre(pet.getNombre());
			boleta.setMetodoPago(metodoPago);
			boleta.setCajero(cajero);
			boleta.setEstado("Activa");

			// Add details (1 to 3 random products)
			int detailItems = random.nextInt(3) + 1;
			double grandTotal = 0.0;
			List<BoletaDetalle> detalles = new ArrayList<>();

			Set<Long> chosenProductIds = new HashSet<>();
			for (int d = 0; d < detailItems; d++) {
				Producto prod = products.get(random.nextInt(products.size()));
				if (chosenProductIds.contains(prod.getId())) continue;
				chosenProductIds.add(prod.getId());

				int cantidad = prod.getCategoria().equalsIgnoreCase("Servicio") ? 1 : (random.nextInt(3) + 1);
				double precio = prod.getPrecio();
				double subtotal = precio * cantidad;

				BoletaDetalle det = new BoletaDetalle(null, boleta, prod.getId(), prod.getNombre(), cantidad, precio, subtotal);
				detalles.add(det);
				grandTotal += subtotal;
			}

			boleta.setDetalles(detalles);
			boleta.setTotal(grandTotal);

			boletaRepository.save(boleta);
			boletaCount++;
		}
		System.out.println("Se generaron " + boletaCount + " boletas de venta.");
		System.out.println("=== SEEDING OF DEMO DATA COMPLETED SUCCESSFULLY ===");
	}
}
