
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = 'blue' | 'sky' | 'indigo' | 'emerald' | 'rose' | 'violet' | 'slate';
export type Density = 'compact' | 'default' | 'relaxed';

interface Theme {
  name: string;
  primary: string;
  hover: string;
  muted: string;
  foreground: string;
}

export const THEMES: Record<ThemeColor, Theme> = {
  blue: { name: 'Royal Blue', primary: '#2563eb', hover: '#1d4ed8', muted: '#eff6ff', foreground: '#ffffff' },
  sky: { name: 'Sky Blue', primary: '#0ea5e9', hover: '#0284c7', muted: '#f0f9ff', foreground: '#ffffff' },
  indigo: { name: 'Indigo', primary: '#6366f1', hover: '#4f46e5', muted: '#f5f3ff', foreground: '#ffffff' },
  emerald: { name: 'Emerald', primary: '#10b981', hover: '#059669', muted: '#f0fdf4', foreground: '#ffffff' },
  rose: { name: 'Rose', primary: '#f43f5e', hover: '#e11d48', muted: '#fff1f2', foreground: '#ffffff' },
  violet: { name: 'Violet', primary: '#8b5cf6', hover: '#7c3aed', muted: '#f5f3ff', foreground: '#ffffff' },
  slate: { name: 'Zinc', primary: '#18181b', hover: '#27272a', muted: '#f4f4f5', foreground: '#ffffff' },
};

interface ThemeContextType {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  density: Density;
  setDensity: (d: Density) => void;
  activeTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [color, setColor] = useState<ThemeColor>(() => (localStorage.getItem('ui-color') as ThemeColor) || 'blue');
  const [density, setDensity] = useState<Density>(() => (localStorage.getItem('ui-density') as Density) || 'default');

  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES[color];

    // Theme Colors
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-hover', theme.hover);
    root.style.setProperty('--primary-muted', theme.muted);
    root.style.setProperty('--primary-foreground', theme.foreground);

    // Density Spacing
    const configMap = {
      compact: { padding: '0.625rem', gap: '0.5rem', radius: '0.5rem', fontSize: '0.95' },
      default: { padding: '1.25rem', gap: '1rem', radius: '0.75rem', fontSize: '1' },
      relaxed: { padding: '2rem', gap: '1.5rem', radius: '1rem', fontSize: '1.05' }
    };

    const config = configMap[density];
    root.style.setProperty('--ui-padding', config.padding);
    root.style.setProperty('--ui-gap', config.gap);
    root.style.setProperty('--ui-radius', config.radius);
    root.style.setProperty('--ui-scale', config.fontSize);

    root.classList.remove('dark');
    localStorage.setItem('ui-color', color);
    localStorage.setItem('ui-density', density);
  }, [color, density]);

  return (
    <ThemeContext.Provider value={{ color, setColor, density, setDensity, activeTheme: THEMES[color] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
