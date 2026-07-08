import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiX } from 'react-icons/fi';
import Navbar from './Navbar/Navbar';
import { registerToastListener } from '../utils/toast';
import { MENU_ROUTES, PawIcon } from './Navbar/Routes';

export default function DashboardLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    registerToastListener((message, type) => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    });
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/agenda')) return 'Agenda';
    if (path.startsWith('/mascotas')) {
      if (path.includes('/perfil/')) return 'Perfil de Mascota';
      return 'Mascotas';
    }
    if (path.startsWith('/clientes')) return 'Clientes';
    if (path.startsWith('/consultas')) return 'Consultas';
    if (path.startsWith('/especialidades')) return 'Especialidades y Vacunas';
    if (path.startsWith('/vacunas')) return 'Vacunas';
    if (path.startsWith('/configuracion')) return 'Configuración';
    if (path.startsWith('/nueva-venta')) return 'Nueva Venta';
    if (path.startsWith('/boletas')) return 'Boletas y Facturación';
    if (path.startsWith('/inventario')) return 'Inventario de Farmacia y Tienda';
    if (path.startsWith('/reportes')) return 'Reportes de Gestión';
    return 'Pets Place';
  };

  const handleMenuClick = (item) => {
    if (item.disabled) {
      alert(`El módulo "${item.name}" está asignado a otro equipo de trabajo.`);
      return;
    }
    navigate(item.path);
  };

  // Obtener etiqueta amigable del rol
  const getRoleLabel = (rol) => {
    if (!rol) return 'Usuario';
    if (typeof rol === 'object') rol = rol.nombre || '';
    if (rol.toUpperCase().includes('ADMIN')) return 'Administración';
    if (rol.toUpperCase().includes('VET')) return 'Veterinario';
    return 'Personal de atención';
  };

  return (
    <div 
      className="flex w-screen overflow-hidden bg-slate-50 font-sans"
      style={{ height: '100vh' }}
    >
      
      {/* SIDEBAR */}
      <aside 
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-950 flex flex-col justify-between text-slate-400 border-r border-slate-900 select-none flex-shrink-0 transition-all duration-300`}
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        <div 
          className="overflow-y-auto py-6 px-4"
          style={{ height: 'calc(100vh - 140px)', overflowY: 'auto' }}
        >
          
          {/* Brand header */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-2'} mb-8 cursor-pointer`} onClick={() => navigate('/')}>
            <div className="bg-gradient-to-tr from-cyan-500 to-teal-400 p-2 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <PawIcon className="w-5 h-5" />
            </div>
            <span className={`text-xl font-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent tracking-tight transition-all duration-300 ${sidebarCollapsed ? 'w-0 overflow-hidden hidden' : ''}`}>Pet Place</span>
          </div>

          {/* User profile section */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'gap-3 p-3'} bg-slate-900/60 rounded-2xl border border-slate-800/80 mb-6 shadow-inner`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-cyan-500/10 flex-shrink-0">
              {user?.nombre?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? 'w-0 overflow-hidden hidden' : ''}`}>
              <h4 className="text-xs font-bold text-white truncate">{user?.nombre || 'admin'}</h4>
              <p className="text-[9px] text-cyan-400 font-extrabold truncate uppercase tracking-widest mt-0.5">
                {getRoleLabel(user?.rol)}
              </p>
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="space-y-6">
            {MENU_ROUTES.map((group, idx) => {
              const userRole = getRoleLabel(user?.rol).toUpperCase();
              const userRoleCode = userRole.includes('ADMIN') ? 'ADMIN' : userRole.includes('VETE') ? 'VET' : 'RECEPCION';
              
              const allowedItems = group.items.filter(item => {
                if (!item.roles) return true;
                return item.roles.includes(userRoleCode);
              });

              if (allowedItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1.5">
                  <span className={`sidebar-title text-[10px] font-extrabold text-slate-600 tracking-wider px-3 block ${sidebarCollapsed ? 'hidden' : ''}`}>
                    {group.section}
                  </span>
                  <ul className="space-y-1">
                    {allowedItems.map((item, itemIdx) => {
                      const isSelected = item.path === '/' 
                        ? location.pathname === '/' 
                        : location.pathname.startsWith(item.path);
                      const Icon = item.icon;

                      return (
                        <li key={itemIdx}>
                          <button
                            onClick={() => handleMenuClick(item)}
                            title={sidebarCollapsed ? item.name : undefined}
                            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 relative ${
                              item.disabled 
                                ? 'opacity-40 cursor-not-allowed hover:bg-transparent' 
                                : isSelected
                                  ? 'bg-gradient-to-r from-cyan-950/40 to-slate-900/40 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-500/5'
                                  : 'hover:bg-slate-900/40 hover:text-slate-200 text-slate-400'
                            }`}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${isSelected ? 'text-cyan-400 scale-105 filter drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            <span className={`sidebar-label ${sidebarCollapsed ? 'w-0 overflow-hidden hidden' : ''}`}>{item.name}</span>
                            
                            {/* Dot indicator for selected page */}
                            {isSelected && !sidebarCollapsed && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer - Accesibilidad & Logout */}
        <div className="p-4 border-t border-slate-900 space-y-3 bg-slate-950/80">
          


          {/* Logout */}
          <button
            onClick={logoutUser}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl text-xs font-semibold hover:bg-red-950/20 hover:text-red-400 transition-colors duration-150`}
            title="Cerrar Sesión"
          >
            <FiLogOut className="w-4.5 h-4.5 text-slate-500 hover:text-red-400" />
            <span className={sidebarCollapsed ? 'hidden' : ''}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div 
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        
        {/* TOPBAR */}
        <Navbar 
          pageTitle={getPageTitle()} 
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* CONTAINER DINÁMICO */}
        <main 
          className="flex-1 p-6 bg-slate-50"
          style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}
        >
          <Outlet />
        </main>
      </div>

      {/* CONTENEDOR FLOTANTE DE NOTIFICACIONES TOAST */}
      <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-5 fade-in duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                : t.type === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-900'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-100 text-amber-900'
                : 'bg-cyan-50 border-cyan-100 text-cyan-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">
                {t.type === 'success' ? '🟢' : t.type === 'error' ? '🔴' : t.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="text-[11px] font-extrabold tracking-tight text-slate-800">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer flex-shrink-0 flex items-center justify-center p-0.5 rounded-lg hover:bg-slate-100/50"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
