import axios from 'axios';

const API_URL = '/api/v1/auth';

/**
 * Servicio para consumir los endpoints de autenticación del backend de Spring Boot.
 */
const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data; // Retorna: { id, token, email, nombre, rol }
};

const register = async (nombre, email, password, rol = 'USER') => {
  const token = sessionStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.post(`${API_URL}/register`, { nombre, email, password, rol }, { headers });
  return response.data; // Retorna: { message }
};

const getCurrentUser = async (token) => {
  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data; // Retorna: { email, permisos }
};

const authService = {
  login,
  register,
  getCurrentUser
};

export default authService;
