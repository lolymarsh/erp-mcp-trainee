import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): 'light' | 'dark' {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  return resolved;
}

const savedTheme = (typeof localStorage !== 'undefined'
  ? (localStorage.getItem('theme') as Theme)
  : null) || 'system';

const initialResolved = applyTheme(savedTheme);

export const useThemeStore = create<ThemeState>((set, get) => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', () => {
        if (get().theme === 'system') {
          const resolved = applyTheme('system');
          set({ resolvedTheme: resolved });
        }
      });
    }
  }

  return {
    theme: savedTheme,
    resolvedTheme: initialResolved,

    setTheme: (theme: Theme) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
      const resolvedTheme = applyTheme(theme);
      set({ theme, resolvedTheme });
    },

    toggleTheme: () => {
      const current = get().resolvedTheme;
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', nextTheme);
      }
      const resolvedTheme = applyTheme(nextTheme);
      set({ theme: nextTheme, resolvedTheme });
    },
  };
});
