package com.petsplace.gestion.config;

import com.petsplace.gestion.model.Producto;
import com.petsplace.gestion.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataSeedInitializer implements CommandLineRunner {

    @Autowired
    private ProductoRepository productoRepository;

    @Override
    public void run(String... args) throws Exception {
        if (productoRepository.count() == 0) {
            System.out.println("=== SEEDING PRODUCTS IN DATABASE ===");
            List<Producto> seedProductos = Arrays.asList(
                new Producto(null, "Comida de Perro Premium 15kg", "ALIM-DOG-15", 12, 120.00, "Alimento", "🐶"),
                new Producto(null, "Lata de Comida Gato Atún", "ALIM-CAT-LATA", 24, 6.50, "Alimento", "🐱"),
                new Producto(null, "Pipeta Antiparasitaria Perro Mediano", "ANTI-PIP-MED", 8, 35.00, "Antiparasitario", "💧"),
                new Producto(null, "Champú Piel Sensible Mascotas", "DERM-CHAM-SEN", 5, 22.00, "Dermatología", "🧴"),
                new Producto(null, "Metronidazol Suspensión Oral 120ml", "MED-METRO-120", 3, 45.00, "Medicamento", "🧴"),
                new Producto(null, "Amoxicilina + Ácido Clavulánico 250mg", "ANTIB-AMO-250", 10, 18.00, "Antibiótico", "💊"),
                new Producto(null, "Collar Ajustable para Gato", "ACC-COL-CAT", 15, 12.00, "Accesorio", "🎀"),
                new Producto(null, "Vitaminas Multivitamínico Canino", "SUP-VIT-CAN", 6, 50.00, "Suplemento", "🍖"),
                new Producto(null, "Consulta Médica General", "SER-CON-GEN", 9999, 40.00, "Servicio", "🩺"),
                new Producto(null, "Baño y Corte de Pelo", "SER-BANO-GROOM", 9999, 30.00, "Servicio", "✂️")
            );
            productoRepository.saveAll(seedProductos);
            System.out.println("=== PRODUCTS SEED COMPLETED SUCCESSFULLY ===");
        }
    }
}
