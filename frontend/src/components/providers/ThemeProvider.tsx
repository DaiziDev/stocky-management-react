import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useThemeStore } from '@/stores/theme.store';

interface ThemeContextType {
  mode: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { mode, resolvedTheme, setMode, toggleTheme, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};