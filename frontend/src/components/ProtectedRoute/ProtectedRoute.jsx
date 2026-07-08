import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MENU_ROUTES } from '../Navbar/Routes';

/**
 * Componente que protege las rutas privadas redireccionando a /login si no hay sesión activa.
 * Además, valida que el rol del usuario esté autorizado para acceder a la ruta solicitada.
 */
const ProtectedRoute = () => {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="hero is-fullheight is-light">
        <div className="hero-body is-justify-content-center is-align-items-center">
          <div className="has-text-centered">
            <button className="button is-loading is-large is-ghost" style={{ border: 'none' }}></button>
            <p className="mt-4 has-text-grey">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Obtener etiqueta amigable del rol
  const getRoleLabel = (rol) => {
    if (!rol) return 'Usuario';
    if (typeof rol === 'object') rol = rol.nombre || '';
    if (rol.toUpperCase().includes('ADMIN')) return 'Administración';
    if (rol.toUpperCase().includes('VET')) return 'Veterinario';
    return 'Personal de atención';
  };

  const userRole = getRoleLabel(user?.rol).toUpperCase();
  const userRoleCode = userRole.includes('ADMIN') ? 'ADMIN' : userRole.includes('VETE') ? 'VET' : 'RECEPCION';

  // Buscar si la ruta actual tiene restricciones de rol en MENU_ROUTES
  let allowedRoles = null;
  for (const group of MENU_ROUTES) {
    const matchedItem = group.items.find(item => {
      return item.path === '/' 
        ? location.pathname === '/' 
        : location.pathname.startsWith(item.path);
    });
    if (matchedItem) {
      allowedRoles = matchedItem.roles;
      break;
    }
  }

  // Si la ruta tiene restricciones de rol y el rol del usuario no está permitido, redirigir al home
  if (allowedRoles && !allowedRoles.includes(userRoleCode)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
