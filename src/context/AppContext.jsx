import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { applyTheme, loadTheme, saveTheme } from '../utils/colorTheme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ebo-lang') || 'es');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ebo-dark') === 'true');
  const [cameraEnabled, setCameraEnabled] = useState(() => localStorage.getItem('ebo-camera') !== 'false');
  const [docType, setDocType] = useState('libro');
  // Colores personalizados por zona (Personalización). Se guardan solo en este navegador.
  const [theme, setTheme] = useState(loadTheme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('ebo-dark', darkMode);
    applyTheme(theme, darkMode);
  }, [darkMode, theme]);

  useEffect(() => { saveTheme(theme); }, [theme]);

  useEffect(() => {
    localStorage.setItem('ebo-lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ebo-camera', cameraEnabled);
  }, [cameraEnabled]);

  return (
    <AppContext.Provider value={{
      lang, setLang, darkMode, setDarkMode, cameraEnabled, setCameraEnabled, docType, setDocType, theme, setTheme,
    }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
