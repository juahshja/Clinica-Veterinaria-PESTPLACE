import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { appointmentService, petService, userService } from '../../services/api';
import { FiPlus, FiCalendar, FiClock, FiUser, FiInfo, FiTrash2, FiX } from 'react-icons/fi';

const tabs = [
  { key: 'Pendiente', color: 'bg-amber-500 text-white' },
  { key: 'Confirmada', color: 'bg-cyan-500 text-white' },
  { key: 'En atención', color: 'bg-indigo-500 text-white' },
  { key: 'Completada', color: 'bg-emerald-500 text-white' },
  { key: 'Cancelada', color: 'bg-rose-500 text-white' },
  { key: 'No asistió', color: 'bg-slate-500 text-white' }
];

export default function Agenda() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState('Pendiente');
  const [selectedDate, setSelectedDate] = useState(todayStr); // Fecha dinámica por defecto
  const [citas, setCitas] = useState([]);
  const [todasLasCitas, setTodasLasCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collisionWarning, setCollisionWarning] = useState('');

  // Campos para nueva cita
  const [mascotaId, setMascotaId] = useState('');
  const [fechaCita, setFechaCita] = useState(todayStr);
  const [horaCita, setHoraCita] = useState('09:00');
  const [motivoCita, setMotivoCita] = useState('');
  const [veterinarioCita, setVeterinarioCita] = useState('');

  const loadCitasYPacientes = async () => {
    setLoading(true);
    const list = await appointmentService.getAll(selectedDate);
    setCitas(list);

    try {
      const allAppts = await appointmentService.getAll('');
      setTodasLasCitas(allAppts || []);
    } catch (e) {
      console.warn("Could not load all appts", e);
    }

    const petsList = await petService.getAll();
    setMascotas(petsList);
    if (petsList.length > 0) {
      setMascotaId(petsList[0].id.toString());
    }

    try {
      const users = await userService.getAll();
      const vets = users.filter(u => {
        const roleName = (u.rol && u.rol.nombre) ? u.rol.nombre.toUpperCase() : '';
        return roleName.includes('VET') || roleName.includes('VETERINARIO');
      });
      setVeterinarios(vets);
      if (vets.length > 0 && !veterinarioCita) {
        setVeterinarioCita(vets[0].nombre);
      }
    } catch (err) {
      console.warn("Could not load system veterinarians", err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadCitasYPacientes();
  }, [selectedDate]);

  useEffect(() => {
    const checkCollision = async () => {
      if (!fechaCita || !horaCita || !veterinarioCita) return;
      try {
        const dayCitas = await appointmentService.getAll(fechaCita);
        const timeToMinutes = (t) => {
          if (!t) return 0;
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const newMinutes = timeToMinutes(horaCita);
        const match = dayCitas.find(c => {
          if (c.veterinario === veterinarioCita && c.estado !== 'Cancelada') {
            const diff = Math.abs(timeToMinutes(c.hora) - newMinutes);
            return diff < 30; // 30 min duration collision
          }
          return false;
        });
        if (match) {
          setCollisionWarning(`⚠️ Conflicto de horario: El/la veterinario(a) ${veterinarioCita} ya tiene una cita de "${match.motivo}" a las ${match.hora} con el paciente "${match.mascota?.nombre || 'Paciente'}".`);
        } else {
          setCollisionWarning('');
        }
      } catch (err) {
        console.error("Collision check error", err);
      }
    };
    checkCollision();
  }, [fechaCita, horaCita, veterinarioCita]);

  // Contar citas por estado
  const getCountByStatus = (status) => {
    return citas.filter(c => c.estado === status).length;
  };

  // Filtrar citas por pestaña seleccionada
  const filteredCitas = citas.filter(c => c.estado === activeTab);

  const handleCreateCita = async (e) => {
    e.preventDefault();
    if (!mascotaId) {
      alert("Por favor, selecciona una mascota.");
      return;
    }

    if (collisionWarning) {
      alert(collisionWarning.replace('⚠️ ', ''));
      return;
    }

    const payload = {
      mascota: { id: Number(mascotaId) },
      fecha: fechaCita,
      hora: horaCita,
      motivo: motivoCita,
      veterinario: veterinarioCita,
      estado: 'Pendiente'
    };

    await appointmentService.create(payload);
    setShowModal(false);
    setMotivoCita('');
    loadCitasYPacientes();
    setActiveTab('Pendiente'); // Cambiar a pestaña pendiente para ver la nueva cita
  };

  const handleUpdateStatus = async (id, status) => {
    await appointmentService.updateStatus(id, status);
    loadCitasYPacientes();
  };

  const handleDeleteCita = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta cita?")) {
      await appointmentService.delete(id);
      loadCitasYPacientes();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      
      {/* SECCIÓN IZQUIERDA: LISTADO DE CITAS POR ESTADO (3 columnas) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Cabecera Interna */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-50 text-cyan-500">
                <FiCalendar className="w-5 h-5" />
              </span>
              <span>Agenda Profesional</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              {citas.length} citas registradas para el día {selectedDate.split('-').reverse().join('/')}
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 !bg-cyan-400 hover:!bg-cyan-500 !text-white text-[13px] font-extrabold h-11 px-6 rounded-xl shadow-sm transition-all duration-150 active:scale-95 !border-0 cursor-pointer"
          >
            <FiPlus className="w-4.5 h-4.5" />
            <span>Nueva Cita</span>
          </button>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          {tabs.map((tab) => {
            const count = getCountByStatus(tab.key);
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-xl text-[11px] font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                  isSelected 
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>{tab.key}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  count > 0 ? tab.color : 'bg-slate-200 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenedor de la lista */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[300px] p-6 flex flex-col justify-between">
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="button is-loading is-large is-ghost border-none">Cargando...</span>
            </div>
          ) : filteredCitas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl">
                🟡
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Sin citas en estado "{activeTab}" para hoy
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Usa el calendario lateral para buscar en otras fechas o añade una nueva cita.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCitas.map((cita) => (
                <div key={cita.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl font-bold border border-slate-100 select-none flex-shrink-0">
                      {cita.mascota?.emoji || '🐶'}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">
                        {cita.mascota?.nombre || 'Paciente'} (Dueño: {cita.mascota?.cliente?.nombre || 'Particular'})
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <FiClock /> {cita.hora}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiUser /> {cita.veterinario || 'General'}
                        </span>
                        {cita.motivo && (
                          <span className="flex items-center gap-1">
                            <FiInfo /> Motivo: {cita.motivo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de cambio de estado */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <select
                      value={cita.estado}
                      onChange={(e) => handleUpdateStatus(cita.id, e.target.value)}
                      className="h-8 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-50 px-2 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="En atención">En atención</option>
                      <option value="Completada">Completada</option>
                      <option value="Cancelada">Cancelada</option>
                      <option value="No asistió">No asistió</option>
                    </select>

                    <button
                      onClick={() => handleDeleteCita(cita.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Eliminar cita"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SECCIÓN DERECHA: MINI-CALENDARIO INTERACTIVO (1 columna) */}
      <div className="space-y-6">
        
        {/* Widget del Calendario */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="text-center border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black text-slate-800 tracking-tight">Julio 2026</h4>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Clic en un día para ver sus citas</p>
          </div>

          {/* Días de la semana */}
          <div 
            className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase select-none"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}
          >
            <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
          </div>

          {/* Días del mes (Ejemplo simulador Julio 2026, empieza en Miércoles 1) */}
          <div 
            className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold select-none"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}
          >
            
            {/* Celdas vacías para desfase con estilo apagado */}
            <span className="aspect-square flex items-center justify-center text-slate-300 font-normal">29</span>
            <span className="aspect-square flex items-center justify-center text-slate-300 font-normal">30</span>

            {/* Días 1 al 31 */}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
              const isSelected = selectedDate === dateStr;
              
              // Resaltar días que tienen citas registradas
              const hasCitas = todasLasCitas.some(c => c.fecha === dateStr);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 hover:bg-slate-100 active:scale-90 ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-white shadow-md shadow-cyan-500/25' 
                      : 'text-slate-700 bg-slate-50/40 border border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[11px]">{day}</span>
                  {hasCitas && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Indicadores de colores */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Confirmada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>En atención</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Cancelada</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: REGISTRAR NUEVA CITA */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    📅 Nueva Cita Médica
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">Registra la fecha, hora, veterinario asignado y motivo de la consulta.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-655 transition-all border-0 bg-transparent cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCita} className="py-8 space-y-6 text-xs">
                
                {/* Mascota */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Seleccionar Mascota</label>
                  <select
                    value={mascotaId}
                    onChange={(e) => setMascotaId(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                  >
                    {mascotas.map(pet => (
                      <option key={pet.id} value={pet.id}>
                        🐶 {pet.nombre} ({pet.especie} - {pet.cliente?.nombre || 'Particular'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Fecha</label>
                    <input
                      type="date"
                      value={fechaCita}
                      onChange={(e) => setFechaCita(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    />
                  </div>

                  {/* Hora */}
                  <div className="flex flex-col gap-2">
                    <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Hora</label>
                    <input
                      type="time"
                      value={horaCita}
                      onChange={(e) => setHoraCita(e.target.value)}
                      className="w-full h-10 border border-slate-200 rounded-xl px-4 focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Veterinario */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Veterinario Tratante</label>
                  <select
                    value={veterinarioCita}
                    onChange={(e) => setVeterinarioCita(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-4 bg-white focus:outline-none focus:border-cyan-400 text-xs font-bold text-slate-700 bg-slate-50/50 cursor-pointer"
                  >
                    {veterinarios.length === 0 ? (
                      <option value="">No hay veterinarios registrados</option>
                    ) : (
                      veterinarios.map(v => (
                        <option key={v.id} value={v.nombre}>{v.nombre}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Motivo */}
                <div className="flex flex-col gap-2">
                  <label className="font-extrabold text-slate-500 uppercase tracking-wider text-[9px]">Motivo de la Cita</label>
                  <textarea
                    value={motivoCita}
                    onChange={(e) => setMotivoCita(e.target.value)}
                    placeholder="Ej. Chequeo anual, vacuna, revisión de patita, etc."
                    className="w-full h-24 border border-slate-200 rounded-xl p-4 focus:outline-none focus:border-cyan-400 resize-none text-xs font-bold text-slate-700 bg-slate-50/50"
                    required
                  />
                </div>

                {/* Advertencia de colisión */}
                {collisionWarning && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-2xl font-bold animate-in fade-in slide-in-from-top-2 duration-150 leading-relaxed select-text">
                    {collisionWarning}
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-4 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!!collisionWarning}
                    className={`flex-1 h-11 text-white rounded-xl font-extrabold shadow-md transition-all border-0 cursor-pointer ${collisionWarning ? 'bg-slate-300 cursor-not-allowed opacity-50 shadow-none' : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-600 hover:to-teal-500 shadow-cyan-500/10 active:scale-[0.97]'}`}
                  >
                    Confirmar Cita
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
