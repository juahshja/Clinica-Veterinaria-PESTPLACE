import React, { useState, useEffect } from 'react';
import { FiSearch, FiCalendar, FiFilter, FiDownload, FiInfo, FiTrash2 } from 'react-icons/fi';
import { auditService } from '../../services/api';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [userFilter, setUserFilter] = useState('TODOS');
  const [dateFilter, setDateFilter] = useState('');

  // Cargar y sembrar logs de auditoría
  const loadLogs = async () => {
    const savedLogs = localStorage.getItem('petplace_audit_logs');
    if (savedLogs && savedLogs.includes('Dr. Fernando Torres')) {
      localStorage.removeItem('petplace_audit_logs');
    }

    if (!localStorage.getItem('petplace_audit_logs')) {
      const seedLogs = [
        {
          id: 1,
          fecha: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          usuario: 'Kenny Sebastian Garay Carlos',
          rol: 'Veterinario',
          categoria: 'CLÍNICA',
          accion: 'Registro de evolución clínica',
          detalles: 'Agregó notas de control y peso (28.5 kg) a la mascota Max (Golden Retriever)',
          ip: '192.168.1.45',
          estado: 'ÉXITO'
        },
        {
          id: 2,
          fecha: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          usuario: 'Kenny Garay',
          rol: 'Administración',
          categoria: 'VENTAS',
          accion: 'Emisión de Boleta de Venta',
          detalles: 'Generó Boleta B001-00122 por S/. 224.90 (Tarjeta). Cliente: Carlos Mendoza.',
          ip: '192.168.1.12',
          estado: 'ÉXITO'
        },
        {
          id: 3,
          fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          usuario: 'Laura Ruiz',
          rol: 'Personal de atención',
          categoria: 'CLÍNICA',
          accion: 'Registro de Paciente',
          detalles: 'Creó perfil de mascota Luna (Labrador) y la asoció al dueño Ana Quiroz.',
          ip: '192.168.1.18',
          estado: 'ÉXITO'
        },
        {
          id: 4,
          fecha: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          usuario: 'Kenny Garay',
          rol: 'Administración',
          categoria: 'SISTEMA',
          accion: 'Actualización de Configuración',
          detalles: 'Modificó datos fiscales de la clínica PetPlace (RUC y Teléfono de contacto).',
          ip: '192.168.1.12',
          estado: 'ÉXITO'
        },
        {
          id: 5,
          fecha: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          usuario: 'Kenny Sebastian Garay Carlos',
          rol: 'Veterinario',
          categoria: 'AUTENTICACIÓN',
          accion: 'Inicio de Sesión',
          detalles: 'Autenticación exitosa en el sistema mediante Spring Boot REST API.',
          ip: '192.168.1.45',
          estado: 'ÉXITO'
        },
        {
          id: 6,
          fecha: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          usuario: 'desconocido@petplace.com',
          rol: 'Desconocido',
          categoria: 'AUTENTICACIÓN',
          accion: 'Intento Fallido de Inicio de Sesión',
          detalles: 'Contraseña incorrecta introducida para el correo admin@petplace.com.',
          ip: '180.12.98.4',
          estado: 'FALLIDO'
        }
      ];
      localStorage.setItem('petplace_audit_logs', JSON.stringify(seedLogs));
    }

    const data = await auditService.getAll();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, []);
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.usuario.toLowerCase().includes(search.toLowerCase()) ||
      log.accion.toLowerCase().includes(search.toLowerCase()) ||
      log.detalles.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === 'TODOS' || log.categoria === category;
    
    const matchesUser = 
      userFilter === 'TODOS' || 
      (userFilter === 'ADMIN' && log.rol === 'Administración') ||
      (userFilter === 'VET' && log.rol === 'Veterinario') ||
      (userFilter === 'RECEPCION' && log.rol === 'Personal de atención');

    const matchesDate = !dateFilter || log.fecha.startsWith(dateFilter);

    return matchesSearch && matchesCategory && matchesUser && matchesDate;
  });

  // Exportar registros a formato CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Usuario', 'Rol', 'Categoría', 'Acción', 'Detalles', 'Estado'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.fecha).toLocaleString(),
      log.usuario,
      log.rol,
      log.categoria,
      log.accion,
      log.detalles.replace(/,/g, ';'), // escapar comas
      log.estado
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_petplace_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Limpiar historial
  const handleClearLogs = () => {
    if (window.confirm('¿Está seguro de que desea vaciar el historial de auditoría? Esta acción no se puede deshacer.')) {
      localStorage.setItem('petplace_audit_logs', JSON.stringify([]));
      setLogs([]);
    }
  };

  // Categorías de Auditoría
  const categories = ['TODOS', 'AUTENTICACIÓN', 'CLÍNICA', 'VENTAS', 'SISTEMA'];

  return (
    <div className="mx-auto p-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="text-[#0d9488]">🛡️</span> Auditoría del Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico de operaciones de seguridad, ventas y acciones clínicas realizadas en la plataforma.
          </p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold py-2 px-4 rounded-xl shadow-sm transition-all cursor-pointer border-0 active:scale-95"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold py-2 px-3 rounded-xl transition-all cursor-pointer border border-red-200/50 active:scale-95"
            title="Vaciar logs"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Vaciar</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Búsqueda de texto */}
          <div className="relative col-span-1 md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalles del evento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
            />

          </div>

          {/* Filtro por fecha */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-semibold bg-slate-50/50"
            />
          </div>

          {/* Filtro por rol / usuario */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0d9488] text-xs text-slate-800 font-bold bg-slate-50/50 appearance-none cursor-pointer"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">Administración</option>
              <option value="VET">Veterinarios</option>
              <option value="RECEPCION">Recepción</option>
            </select>
          </div>

        </div>

        {/* Pestañas de Categoría */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                category === cat
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Fecha y Hora</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Usuario</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Rol</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Categoría</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Operación</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none">Detalles del Evento</th>
                <th className="py-3.5 px-4 text-[10px] font-extrabold text-slate-600 uppercase select-none text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiInfo className="w-6 h-6 text-slate-300" />
                      <span>No se encontraron registros de auditoría que coincidan con los filtros.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  // Colores por categoría
                  const catColors = {
                    'AUTENTICACIÓN': 'bg-blue-50 text-blue-600 border-blue-100/50',
                    'CLÍNICA': 'bg-teal-50 text-[#0d9488] border-teal-100/50',
                    'VENTAS': 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
                    'SISTEMA': 'bg-purple-50 text-purple-600 border-purple-100/50'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-semibold text-[11px] whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-bold text-[11px]">
                        {log.usuario}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold text-[11px] whitespace-nowrap">
                        {log.rol}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-md uppercase tracking-wider ${catColors[log.categoria] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                          {log.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-bold text-[11px] whitespace-nowrap">
                        {log.accion}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium text-[11px] max-w-md break-words" title={log.detalles}>
                        {log.detalles}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                          log.estado === 'ÉXITO' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer de Tabla */}
        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold select-none">
          <span>Mostrando {filteredLogs.length} de {logs.length} registros</span>
          <span>Clínica Veterinaria PetPlace - Control de Seguridad</span>
        </div>
      </div>

    </div>
  );
}
