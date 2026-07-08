package com.petsplace.gestion;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.petsplace.gestion.repository.ProductoRepository;

@SpringBootTest
class PetsplaceApplicationTests {

	@Autowired
	private ProductoRepository productoRepository;

	@Test
	void printDatabaseDetails() {
		System.out.println("=== PRODUCTOS IN DATABASE ===");
		productoRepository.findAll().forEach(p -> System.out.println("SKU: " + p.getSku() + ", Nombre: " + p.getNombre() + ", Categoria: " + p.getCategoria() + ", Stock: " + p.getStock() + ", Precio: " + p.getPrecio()));
	}
}
