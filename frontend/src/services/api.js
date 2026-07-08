import axios from 'axios';

// Instancia global de Axios para llamadas REST
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Interceptor para inyectar el token JWT en cada petición HTTP
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Limpieza de datos mock de LocalStorage de versiones previas
const initLocalStorageDB = () => {
  const legacyMocks = [
    'db_clientes', 'db_mascotas', 'db_especialidades', 'db_vacunas', 
    'db_mascotas_vacunas', 'db_consultas', 'db_citas', 'db_productos', 
    'db_boletas', 'db_usuarios'
  ];
  legacyMocks.forEach(key => localStorage.removeItem(key));

  if (!localStorage.getItem('db_cargos_pendientes')) {
    localStorage.setItem('db_cargos_pendientes', JSON.stringify([]));
  }
};

initLocalStorageDB();

// Registro de logs de auditoría local y sincronización con el servidor
export const addLocalAuditLog = (categoria, accion, detalles, estado = 'ÉXITO') => {
  try {
    const logs = JSON.parse(localStorage.getItem('petplace_audit_logs')) || [];
    let usuario = 'admin@petplace.com';
    let rol = 'Administración';
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        usuario = u.nombre || u.email || usuario;
        rol = (typeof u.rol === 'object' ? u.rol.nombre : u.rol) || rol;
      } catch (e) {}
    }
    
    const newLog = {
      fecha: new Date().toISOString(),
      usuario,
      rol: rol.toUpperCase().includes('ADMIN') ? 'Administración' : rol.toUpperCase().includes('VET') ? 'Veterinario' : 'Personal de atención',
      categoria,
      accion,
      detalles,
      ip: '127.0.0.1',
      estado
    };
    
    const localLog = { ...newLog, id: Date.now() + Math.floor(Math.random() * 1000) };
    logs.unshift(localLog);
    localStorage.setItem('petplace_audit_logs', JSON.stringify(logs.slice(0, 200)));

    // Registrar en el backend centralizado de forma asíncrona
    api.post('/api/v1/auditoria', newLog)
      .catch(() => console.log("Servidor ocupado. Auditoría registrada localmente."));
  } catch (e) {
    console.error('Error registrando auditoría:', e);
  }
};

// =========================================================================
// SERVICIOS DE API REST CONECTADOS DIRECTAMENTE A POSTGRESQL / SUPABASE
// =========================================================================

// 1. Gestión de Propietarios / Clientes
export const clientService = {
  getAll: async () => {
    const res = await api.get('/api/v1/clientes');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/clientes', data);
    addLocalAuditLog('CLÍNICA', 'Registro de Propietario', `Creó perfil del dueño: ${data.nombre} (DNI: ${data.dni})`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/clientes/${id}`, data);
    addLocalAuditLog('CLÍNICA', 'Edición de Propietario', `Actualizó datos del dueño: ${data.nombre} (DNI: ${data.dni})`);
    return res.data;
  },
  delete: async (id, nombre) => {
    await api.delete(`/api/v1/clientes/${id}`);
    addLocalAuditLog('CLÍNICA', 'Eliminación de Propietario', `Eliminó dueño: ${nombre || id}`);
  }
};

// 2. Gestión de Pacientes / Mascotas
export const petService = {
  getAll: async () => {
    const res = await api.get('/api/v1/mascotas');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/api/v1/mascotas/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/mascotas', data);
    addLocalAuditLog('CLÍNICA', 'Registro de Paciente', `Registró nueva mascota: ${data.nombre} (${data.especie})`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/mascotas/${id}`, data);
    addLocalAuditLog('CLÍNICA', 'Edición de Paciente', `Actualizó expediente de mascota: ${data.nombre}`);
    return res.data;
  },
  delete: async (id, nombre) => {
    await api.delete(`/api/v1/mascotas/${id}`);
    addLocalAuditLog('CLÍNICA', 'Eliminación de Paciente', `Desactivó mascota: ${nombre || id}`);
  },
  // Inoculaciones/Vacunas aplicadas a mascotas
  getVacunas: async (petId) => {
    const res = await api.get(`/api/v1/mascotas/${petId}/vacunas`);
    return res.data;
  },
  addVacuna: async (petId, data, petNombre) => {
    const res = await api.post(`/api/v1/mascotas/${petId}/vacunas`, data);
    addLocalAuditLog('CLÍNICA', 'Aplicación de Vacuna', `Aplicó vacuna a mascota: ${petNombre || petId}`);
    return res.data;
  },
  // Consultas médicas e historiales clínicos
  getConsultas: async (petId) => {
    const res = await api.get(`/api/v1/mascotas/${petId}/consultas`);
    return res.data;
  },
  // Historiales de pesos y temperatura
  getEvolucion: async (petId) => {
    const res = await api.get(`/api/v1/mascotas/${petId}/evolucion`);
    return res.data;
  },
  addEvolucion: async (petId, data, petNombre) => {
    const res = await api.post(`/api/v1/mascotas/${petId}/evolucion`, data);
    addLocalAuditLog('CLÍNICA', 'Registro de evolución clínica', `Agregó evolución a mascota: ${petNombre || petId} (Peso: ${data.peso} kg)`);
    return res.data;
  },
  // Documentos digitales asociados
  getDocumentos: async (petId) => {
    const res = await api.get(`/api/v1/mascotas/${petId}/documentos`);
    return res.data;
  },
  addDocumento: async (petId, data, petNombre) => {
    const res = await api.post(`/api/v1/mascotas/${petId}/documentos`, data);
    addLocalAuditLog('CLÍNICA', 'Subida de archivo médico', `Subió documento médico: ${data.nombre} para mascota: ${petNombre || petId}`);
    return res.data;
  },
  deleteDocumento: async (docId) => {
    await api.delete(`/api/v1/mascotas/documentos/${docId}`);
  }
};

// 3. Catálogo de Especialidades Clínicas
export const specialtyService = {
  getAll: async () => {
    const res = await api.get('/api/v1/especialidades');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/especialidades', data);
    addLocalAuditLog('SISTEMA', 'Creación de Especialidad', `Creó especialidad médica: ${data.nombre}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/especialidades/${id}`, data);
    addLocalAuditLog('SISTEMA', 'Edición de Especialidad', `Actualizó especialidad médica: ${data.nombre}`);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/api/v1/especialidades/${id}`);
    addLocalAuditLog('SISTEMA', 'Eliminación de Especialidad', `Eliminó especialidad ID: ${id}`);
  }
};

// 4. Catálogo Global de Vacunas
export const vaccineService = {
  getAll: async () => {
    const res = await api.get('/api/v1/vacunas');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/vacunas', data);
    addLocalAuditLog('SISTEMA', 'Creación de Vacuna', `Creó vacuna en catálogo: ${data.nombre}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/vacunas/${id}`, data);
    addLocalAuditLog('SISTEMA', 'Edición de Vacuna', `Actualizó vacuna en catálogo: ${data.nombre}`);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/api/v1/vacunas/${id}`);
    addLocalAuditLog('SISTEMA', 'Eliminación de Vacuna', `Eliminó vacuna ID: ${id}`);
  }
};

// 5. Consultas Clínicas Generales
export const consultationService = {
  getAll: async () => {
    const res = await api.get('/api/v1/consultas');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/consultas', data);
    addLocalAuditLog('CLÍNICA', 'Registro de Consulta', `Registró consulta médica por motivo: ${data.motivo}`);
    return res.data;
  }
};

// 6. Gestión de Citas y Reservas de la Agenda
export const appointmentService = {
  getAll: async (fecha) => {
    const res = await api.get(`/api/v1/citas${fecha ? `?fecha=${fecha}` : ''}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/citas', data);
    addLocalAuditLog('CLÍNICA', 'Reserva de Cita', `Agendó cita para la fecha ${data.fecha} a las ${data.hora}`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/citas/${id}`, data);
    addLocalAuditLog('CLÍNICA', 'Modificación de Cita', `Actualizó datos de la cita ID: ${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/api/v1/citas/${id}/estado`, status, {
      headers: { 'Content-Type': 'text/plain' }
    });
    addLocalAuditLog('CLÍNICA', 'Cambio de Estado de Cita', `Cambió estado de la cita ID: ${id} a ${status}`);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/api/v1/citas/${id}`);
    addLocalAuditLog('CLÍNICA', 'Cancelación de Cita', `Eliminó/canceló cita ID: ${id}`);
  }
};

// 7. Inventario de Productos y Farmacia
export const productService = {
  getAll: async () => {
    const res = await api.get('/api/v1/productos');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/productos', data);
    addLocalAuditLog('SISTEMA', 'Creación de Producto', `Agregó producto al inventario: ${data.nombre} (SKU: ${data.sku})`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/productos/${id}`, data);
    addLocalAuditLog('SISTEMA', 'Edición de Producto', `Actualizó stock/datos del producto: ${data.nombre}`);
    return res.data;
  },
  delete: async (id, nombre) => {
    await api.delete(`/api/v1/productos/${id}`);
    addLocalAuditLog('SISTEMA', 'Eliminación de Producto', `Eliminó producto: ${nombre || id}`);
  }
};

// 8. Facturación y Boletas de Venta
export const boletaService = {
  getAll: async () => {
    const res = await api.get('/api/v1/boletas');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/boletas', data);
    addLocalAuditLog('VENTAS', 'Emisión de Boleta de Venta', `Generó boleta por un total de S/. ${Number(data.total || 0).toFixed(2)}`);
    return res.data;
  },
  anular: async (id, motivo) => {
    const res = await api.put(`/api/v1/boletas/${id}/anular`, { motivo });
    addLocalAuditLog('VENTAS', 'Anulación de Boleta de Venta', `Anuló boleta ID: ${id}. Motivo: ${motivo}`);
    return res.data;
  }
};

// 9. Gestión de Usuarios
export const userService = {
  getAll: async () => {
    const res = await api.get('/api/v1/usuarios');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/api/v1/usuarios', data);
    addLocalAuditLog('SISTEMA', 'Creación de Usuario', `Registró nuevo usuario: ${data.nombre} (${data.rol})`);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/api/v1/usuarios/${id}`, data);
    addLocalAuditLog('SISTEMA', 'Edición de Usuario', `Actualizó usuario: ${data.nombre}`);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/api/v1/usuarios/${id}`);
    addLocalAuditLog('SISTEMA', 'Eliminación de Usuario', `Eliminó usuario del sistema ID: ${id}`);
  }
};

// 10. Bitácoras de Auditoría
export const auditService = {
  getAll: async () => {
    const res = await api.get('/api/v1/auditoria');
    return res.data;
  }
};

// 11. Ajustes y Parámetros del Sistema
export const systemConfigService = {
  get: async () => {
    const res = await api.get('/api/v1/configuraciones');
    if (res.data) {
      localStorage.setItem('petplace_system_config', JSON.stringify(res.data));
    }
    return res.data;
  },
  save: async (config) => {
    const res = await api.post('/api/v1/configuraciones', config);
    localStorage.setItem('petplace_system_config', JSON.stringify(res.data));
    addLocalAuditLog('SISTEMA', 'Actualización de Ajustes', 'Modificó los datos/ajustes de cabecera de la clínica');
    return res.data;
  }
};

// 12. Cola de Cargos Médicos Pendientes de Cobro (Caja POS)
export const addPendingCharge = (mascotaId, mascotaNombre, clienteNombre, tipo, descripcion, costo) => {
  try {
    const list = JSON.parse(localStorage.getItem('db_cargos_pendientes')) || [];
    list.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      mascotaId: Number(mascotaId),
      mascotaNombre,
      clienteNombre,
      tipo,
      descripcion,
      costo: Number(costo),
      fecha: new Date().toISOString()
    });
    localStorage.setItem('db_cargos_pendientes', JSON.stringify(list));
  } catch (e) {
    console.error("Error al registrar cargo pendiente", e);
  }
};

export const billingService = {
  getPendingCharges: (mascotaId) => {
    try {
      const list = JSON.parse(localStorage.getItem('db_cargos_pendientes')) || [];
      return list.filter(item => item.mascotaId === Number(mascotaId));
    } catch (e) {
      return [];
    }
  },
  removePendingCharges: (mascotaId) => {
    try {
      const list = JSON.parse(localStorage.getItem('db_cargos_pendientes')) || [];
      const updated = list.filter(item => item.mascotaId !== Number(mascotaId));
      localStorage.setItem('db_cargos_pendientes', JSON.stringify(updated));
    } catch (e) {}
  }
};

export default api;
