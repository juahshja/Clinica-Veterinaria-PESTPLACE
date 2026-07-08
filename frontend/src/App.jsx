import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './autenticacion/Login';
import Register from './autenticacion/Register';

// Páginas del Sistema
import Dashboard from './pages/Dashboard/Dashboard';
import Agenda from './pages/Agenda/Agenda';
import Mascotas from './pages/Mascotas/Mascotas';
import PerfilMascota from './pages/Mascotas/PerfilMascota';
import Clientes from './pages/Clientes/Clientes';
import Especialidades from './pages/Especialidades/Especialidades';
import Configuracion from './pages/Configuracion/Configuracion';
import Auditoria from './pages/Configuracion/Auditoria';
import Usuarios from './pages/Configuracion/Usuarios';
import NuevaVenta from './pages/Caja/NuevaVenta';
import Boletas from './pages/Caja/Boletas';
import Inventario from './pages/Gestion/Inventario';
import Reportes from './pages/Gestion/Reportes';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />


          {/* Rutas Privadas / Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/mascotas" element={<Mascotas />} />
              <Route path="/mascotas/perfil/:id" element={<PerfilMascota />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/especialidades" element={<Especialidades />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/auditoria" element={<Auditoria />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/nueva-venta" element={<NuevaVenta />} />
              <Route path="/boletas" element={<Boletas />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/reportes" element={<Reportes />} />
            </Route>
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

