import { ThemeProvider } from '@nimbus-ds/styles';
import {
  useState,
  createContext,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';

interface IDarkModeContext {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const DarkModeContext = createContext<IDarkModeContext>(null as any);

interface IDarkModeProvider {
  children: ReactNode;
}

export const DarkModeProvider: React.FC<IDarkModeProvider> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = useCallback(
    () => setDarkMode((prevState) => {
      const next = !prevState;
      localStorage.setItem('darkMode', JSON.stringify(next));
      return next;
    }),
    [],
  );

  const contextValue = useMemo(
    () => ({ darkMode, toggleDarkMode }),
    [darkMode, toggleDarkMode],
  );

  useEffect(() => {
    const storageValue = localStorage.getItem('darkMode');
    if (storageValue) {
      setDarkMode(JSON.parse(storageValue));
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  return (
    <DarkModeContext.Provider value={contextValue}>
      {/* The admin currently doesn't support dark mode. When it does, replace
      `base` value with `currentTheme` to provide dark mode support. */}
      <ThemeProvider theme="base">{children}</ThemeProvider>
    </DarkModeContext.Provider>
  );
};

export default DarkModeProvider;
