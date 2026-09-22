import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedTheme: 'light',

      setMode: (mode) => {
        const resolved = resolveTheme(mode);
        set({ mode, resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        localStorage.setItem('theme-mode', mode);
      },

      toggleTheme: () => {
        const { mode } = get();
        const modes: ThemeMode[] = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(mode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        get().setMode(nextMode);
      },

      initializeTheme: () => {
        const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
        const mode = savedMode || 'system';
        const resolved = resolveTheme(mode);
        set({ mode, resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', resolved === 'dark');

        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const { mode } = get();
            if (mode === 'system') {
              const resolved = getSystemTheme();
              set({ resolvedTheme: resolved });
              document.documentElement.classList.toggle('dark', resolved === 'dark');
            }
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);