import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Validar el token con el endpoint /me de Spring Boot
          await authService.getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Sesión inválida o expirada:', error);
          // Limpiar datos inválidos en caso de error
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } else {
        // Limpieza si solo hay uno de los dos
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      const { token: jwtToken, ...userData } = data;

      // Persistir token y datos de usuario en sessionStorage
      sessionStorage.setItem('token', jwtToken);
      sessionStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Error de login:', error);
      const message = error.response?.data?.message || 'Credenciales inválidas o error de conexión.';
      return { success: false, message };
    }
  };

  const registerUser = async (nombre, email, password, rol) => {
    try {
      const response = await authService.register(nombre, email, password, rol);
      return { success: true, message: response.message || 'Registro exitoso.' };
    } catch (error) {
      console.error('Error de registro:', error);
      const message = error.response?.data?.message || 'Error al intentar registrar el usuario.';
      return { success: false, message };
    }
  };

  const logoutUser = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
