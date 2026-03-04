import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage or default to system
    try {
        const stored = localStorage.getItem('theme');
        return (stored as Theme) || 'system';
    } catch {
        return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Determine actual theme
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const finalTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    
    setResolvedTheme(finalTheme);
    
    // Update HTML attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', finalTheme);

    // Watch for system changes if in system mode
    if (theme === 'system') {
        const listener = (e: MediaQueryListEvent) => {
            setResolvedTheme(e.matches ? 'dark' : 'light');
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        query.addEventListener('change', listener);
        return () => query.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
