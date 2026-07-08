import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bulma/css/bulma.min.css'
import './autenticacion/Auth.css'
import './index.css'
import App from './App.jsx'
import { toast } from './utils/toast'

window.alert = (message) => {
  if (typeof message === 'string' && (message.toLowerCase().includes('error') || message.toLowerCase().includes('falló'))) {
    toast.error(message);
  } else if (typeof message === 'string' && (message.toLowerCase().includes('éxito') || message.toLowerCase().includes('guardado') || message.toLowerCase().includes('exitosamente'))) {
    toast.success(message);
  } else {
    toast.warning(message);
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
