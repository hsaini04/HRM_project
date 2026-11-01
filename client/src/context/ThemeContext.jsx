import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

// Keep in sync with the inline script in index.html, which applies the theme before first paint.
const STORAGE_KEY = 'skillbridge.theme';

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this tab only.
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // An explicit choice wins; until one is made the app follows the operating system setting.
  const [choice, setChoice] = useState(readStored);
  const [systemDark, setSystemDark] = useState(() => Boolean(darkQuery()?.matches));

  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = choice || (systemDark ? 'dark' : 'light');

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.dataset.theme === theme) return undefined;
    // Suppress colour transitions while the new colours are computed, so the page swaps at once.
    root.classList.add('theme-switching');
    root.dataset.theme = theme;
    void window.getComputedStyle(document.body).color;
    const timer = setTimeout(() => root.classList.remove('theme-switching'), 0);
    return () => {
      clearTimeout(timer);
      root.classList.remove('theme-switching');
    };
  }, [theme]);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    writeStored(next);
    setChoice(next);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
