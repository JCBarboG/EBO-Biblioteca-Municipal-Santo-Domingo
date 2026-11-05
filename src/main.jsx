import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import './index.css';
import App from './App.jsx';
// Tema visual "Opción C · Riel y lectura de arriba abajo" (solo presentación).
// Va después de App para sobrescribir App.css.
import './theme-opcion-c.css';
// Página de personalización de colores (maqueta, selector y avisos).
import './theme-personalizacion.css';
import './library.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
