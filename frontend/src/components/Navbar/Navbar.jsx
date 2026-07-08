import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiBell, FiPlus, FiCalendar, FiX, FiLogOut, FiMenu } from 'react-icons/fi';
import { petService, productService, appointmentService } from '../../services/api';

export default function Navbar({ pageTitle, toggleSidebar, sidebarCollapsed }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Cargar notificaciones dinámicas basadas en stock 0 y citas de hoy
  useEffect(() => {
    const loadDynamicNotifications = async () => {
      try {
        const alertsList = [];
        
        // 1. Productos sin stock o con stock bajo
        const prods = await productService.getAll();
        if (prods && Array.isArray(prods)) {
          prods.forEach(p => {
            if (p.categoria === 'Servicio') return; // Los servicios no tienen control de stock físico
            
            if (p.stock === 0) {
              alertsList.push({
                id: `stock-${p.id}`,
                title: `Sin stock - ${p.nombre}`,
                desc: `El producto se encuentra agotado en el inventario.`,
                type: 'alert'
              });
            } else if (p.stock <= 5) {
              alertsList.push({
                id: `stock-bajo-${p.id}`,
                title: `Stock bajo - ${p.nombre}`,
                desc: `¡Quedan pocas unidades! Stock disponible: ${p.stock}`,
                type: 'warning'
              });
            }
          });
        }

        // 2. Citas programadas para hoy
        const todayDate = new Date().toISOString().split('T')[0];
        const appointments = await appointmentService.getAll(todayDate);
        if (appointments && Array.isArray(appointments)) {
          appointments.filter(c => c.estado === 'Pendiente' || c.estado === 'Confirmada').forEach(c => {
            alertsList.push({
              id: `cita-${c.id}`,
              title: `Cita de hoy: ${c.mascota?.nombre || 'Paciente'}`,
              desc: `Programada a las ${c.hora} con ${c.veterinario || 'Veterinario'}.`,
              type: 'info'
            });
          });
        }

        setNotifications(alertsList);
      } catch (err) {
        console.warn("Error loading dynamic notifications", err);
      }
    };
    loadDynamicNotifications();
  }, [showNotifications]);
  const [allPets, setAllPets] = useState([]);

  // Cargar mascotas para el buscador global
  useEffect(() => {
    const loadPetsForSearch = async () => {
      try {
        const list = await petService.getAll();
        setAllPets(list || []);
      } catch (err) {
        console.error("Error loading pets for search", err);
      }
    };
    loadPetsForSearch();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = allPets.filter(pet => {
      const petName = (pet.nombre || '').toLowerCase();
      const ownerName = (pet.cliente?.nombre || '').toLowerCase();
      const breed = (pet.raza || '').toLowerCase();
      const species = (pet.especie || '').toLowerCase();
      return petName.includes(lower) || ownerName.includes(lower) || breed.includes(lower) || species.includes(lower);
    });
    setSearchResults(filtered.slice(0, 5));
  };

  // Obtener etiqueta amigable del rol
  const getRoleLabel = (rol) => {
    if (!rol) return 'Usuario';
    if (typeof rol === 'object') rol = rol.nombre || '';
    if (rol.toUpperCase().includes('ADMIN')) return 'Administración';
    if (rol.toUpperCase().includes('VET')) return 'Veterinario';
    return 'Personal de atención';
  };

  const handleQuickAction = (action) => {
    setShowQuickActionModal(false);
    if (action === 'paciente') {
      navigate('/mascotas');
    } else if (action === 'cita') {
      navigate('/agenda');
    } else if (action === 'consulta') {
      navigate('/consultas');
    } else if (action === 'venta') {
      navigate('/nueva-venta');
    } else if (action === 'vacuna') {
      navigate('/vacunas');
    }
  };

  return (
    <>
      <header 
        className="h-16 w-full bg-white border-b border-slate-200 flex flex-row items-center justify-between px-6 flex-shrink-0 select-none z-10"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', width: '100%', height: '64px' }}
      >
        
        {/* Buscador y Título de Página (Izquierda) */}
        <div 
          className="flex items-center gap-4 flex-shrink-0"
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', flexShrink: 0 }}
        >
          {/* Botón para colapsar/expandir el menú (sidebar) */}
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors border-0 bg-transparent cursor-pointer active:scale-95"
            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <FiMenu className="w-5 h-5 text-slate-700" />
          </button>
          
          <h1 className="text-sm font-black text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          
          {/* Buscador global */}
          <div className="relative hidden md:block w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">
              <FiSearch className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar mascota, dueño..."
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setSearchResults([]), 200)}
              className="w-full h-8 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white transition-all duration-150"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent p-0 flex items-center justify-center cursor-pointer"
              >
                <FiX className="w-3 h-3" />
              </button>
            )}

            {/* Resultados de Búsqueda */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-2xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-1 select-none">
                <div className="px-3 pb-1.5 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Resultados encontrados ({searchResults.length})
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map(pet => (
                    <div
                      key={pet.id}
                      onClick={() => {
                        navigate(`/mascotas/perfil/${pet.id}`);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="px-3 py-2 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex items-center gap-3 transition-colors last:border-none"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {pet.especie === 'Gato' ? '🐱' : '🐶'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">
                          {pet.nombre} <span className="text-[9px] font-normal text-slate-400">({pet.raza || 'Común'})</span>
                        </p>
                        <p className="text-[8.5px] text-slate-400 font-semibold truncate mt-0.5">
                          Dueño: {pet.cliente?.nombre || 'Sin dueño'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones (Derecha - Formateado exactamente como el prototipo) */}
        <div 
          className="flex items-center gap-2 flex-shrink-0 ml-auto"
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}
        >
          
          {/* Campana de Notificaciones en caja cuadrada */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded-xl text-slate-500 flex items-center justify-center transition-all duration-150 relative active:scale-95 shadow-sm cursor-pointer"
            >
              <FiBell className="w-4.5 h-4.5 text-amber-500" />
              {notifications.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Panel de notificaciones flotante */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl py-3 z-50 animate-in fade-in-50 slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-800">Alertas Recientes</span>
                  {notifications.length > 0 && (
                    <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                      {notifications.length} {notifications.length === 1 ? 'Nueva' : 'Nuevas'}
                    </span>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-semibold">
                      🔔 No hay alertas recientes pendientes.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                        <p className="text-[11px] font-bold text-slate-850">
                          {n.type === 'alert' ? '🔴 ' : n.type === 'warning' ? '⚠️ ' : '📅 '} {n.title}
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 pt-2 text-center">
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-cyan-500 hover:text-cyan-600 border-0 bg-transparent cursor-pointer">
                    Entendido
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Icono de Calendario en caja cuadrada */}
          <button 
            onClick={() => navigate('/agenda')}
            className="w-10 h-10 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-white rounded-xl text-slate-500 flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          >
            <FiCalendar className="w-4.5 h-4.5 text-indigo-500" />
          </button>

          {/* Botón + Rápido (Teal del prototipo) */}
          <button 
            onClick={() => setShowQuickActionModal(true)}
            className="flex items-center justify-center gap-1.5 !bg-gradient-to-r !from-cyan-500 !to-teal-400 hover:!from-cyan-600 hover:!to-teal-500 !text-white font-extrabold h-10 px-5 rounded-xl text-xs transition-all duration-200 shadow-md shadow-cyan-500/10 active:scale-95 !border-0 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Rápido</span>
          </button>

          {/* Botón de Cerrar Sesión */}
          <button 
            onClick={logoutUser}
            title="Cerrar sesión"
            className="w-10 h-10 bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl text-slate-500 hover:text-red-650 flex items-center justify-center transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          >
            <FiLogOut className="w-4.5 h-4.5 text-red-500" />
          </button>

          {/* MODAL DE ACCIÓN RÁPIDA (Estilo Prototipo) */}
          {showQuickActionModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-200 animate-in zoom-in-95 duration-150">
                <div className="border-b border-slate-150 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      ⚡ Acciones Rápidas
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Accesos directos a las operaciones más comunes de la clínica.</p>
                  </div>
                  <button 
                    onClick={() => setShowQuickActionModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border-0 bg-transparent cursor-pointer"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-6 grid grid-cols-2 gap-3 text-xs select-none">
                  
                  <button
                    type="button"
                    onClick={() => handleQuickAction('paciente')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-50/30 border border-slate-200 hover:border-cyan-200 transition-all duration-150 active:scale-95 group text-left cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🐾</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">Nuevo Paciente</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Registrar mascota</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('cita')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-50/30 border border-slate-200 hover:border-cyan-200 transition-all duration-150 active:scale-95 group text-left cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">Nueva Cita</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Reservar agenda</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('consulta')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-50/30 border border-slate-200 hover:border-cyan-200 transition-all duration-150 active:scale-95 group text-left cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🩺</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">Nueva Consulta</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Registrar diagnóstico</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('venta')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-50/30 border border-slate-200 hover:border-cyan-200 transition-all duration-150 active:scale-95 group text-left cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">🛍️</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">Nueva Venta</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Generar boleta</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAction('vacuna')}
                    className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50/50 hover:bg-cyan-50/30 border border-slate-200 hover:border-cyan-200 transition-all duration-150 active:scale-95 group text-left col-span-2 justify-center cursor-pointer"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">💉</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">Registrar Vacunación</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Aplicar dosis</span>
                    </div>
                  </button>

                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQuickActionModal(false)}
                    className="flex-1 h-11 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

      </header>
    </>
  );
}
