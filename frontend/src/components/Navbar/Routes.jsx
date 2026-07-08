import React from 'react';
import { 
  FiHome, FiCalendar, FiUsers, FiFileText, FiShield, 
  FiStar, FiShoppingCart, FiPrinter, FiPackage, 
  FiBarChart2, FiUser, FiSettings
} from 'react-icons/fi';

// Componente del Icono de Huella
export function PawIcon({ className = "w-5 h-5" }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      fill="currentColor"
      width="20"
      height="20"
      style={{ width: '20px', height: '20px', display: 'inline-block', minWidth: '20px', minHeight: '20px' }}
    >
      <ellipse cx="32" cy="42" rx="14" ry="12" />
      <ellipse cx="14" cy="28" rx="6" ry="8" transform="rotate(-20 14 28)" />
      <ellipse cx="24" cy="20" rx="6" ry="8" transform="rotate(-8 24 20)" />
      <ellipse cx="40" cy="20" rx="6" ry="8" transform="rotate(8 40 20)" />
      <ellipse cx="50" cy="28" rx="6" ry="8" transform="rotate(20 50 28)" />
    </svg>
  );
}

// Configuración de rutas organizadas por secciones del sidebar con permisos por ROL
export const MENU_ROUTES = [
  {
    section: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', path: '/', icon: FiHome, disabled: false, roles: ['ADMIN', 'VET', 'RECEPCION'] },
      { name: 'Agenda', path: '/agenda', icon: FiCalendar, disabled: false, roles: ['ADMIN', 'VET', 'RECEPCION'] },
    ]
  },
  {
    section: 'CLÍNICA',
    items: [
      { name: 'Mascotas', path: '/mascotas', icon: PawIcon, disabled: false, roles: ['ADMIN', 'VET', 'RECEPCION'] },
      { name: 'Clientes', path: '/clientes', icon: FiUsers, disabled: false, roles: ['ADMIN', 'RECEPCION'] },
      { name: 'Especialidades y Vacunas', path: '/especialidades', icon: FiStar, disabled: false, roles: ['ADMIN'] },
    ]
  },
  {
    section: 'CAJA',
    items: [
      { name: 'Nueva Venta', path: '/nueva-venta', icon: FiShoppingCart, disabled: false, roles: ['ADMIN', 'RECEPCION', 'VET'] },
      { name: 'Boletas', path: '/boletas', icon: FiPrinter, disabled: false, roles: ['ADMIN', 'RECEPCION', 'VET'] },
    ]
  },
  {
    section: 'GESTIÓN',
    items: [
      { name: 'Inventario', path: '/inventario', icon: FiPackage, disabled: false, roles: ['ADMIN'] },
      { name: 'Reportes', path: '/reportes', icon: FiBarChart2, disabled: false, roles: ['ADMIN'] },
    ]
  },
  {
    section: 'SISTEMA',
    items: [
      { name: 'Configuración', path: '/configuracion', icon: FiSettings, disabled: false, roles: ['ADMIN'] },
      { name: 'Auditoría', path: '/auditoria', icon: FiShield, disabled: false, roles: ['ADMIN'] },
      { name: 'Usuarios', path: '/usuarios', icon: FiUser, disabled: false, roles: ['ADMIN'] },
    ]
  }
];

export default MENU_ROUTES;
