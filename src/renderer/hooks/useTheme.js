import { useState, useEffect, useCallback } from 'react';

const THEMES = ['dark', 'light', 'system'];

/**
 * useTheme
 *
 * Manages the active theme.  Persists to settings via window.macterm.settings.
 * Applies data-theme to <html> so all CSS variables update instantly.
 *
 * Returns { theme, setTheme, resolvedTheme }
 *   theme         — 'dark' | 'light' | 'system'  (stored preference)
 *   setTheme      — change and persist
 *   resolvedTheme — 'dark' | 'light'  (what's actually showing right now)
 */
export function useTheme(initialTheme = 'dark') {
  const [theme, setThemeState] = useState(initialTheme);

  // Determine what's actually rendered
  const resolve = (t) => {
    if (t !== 'system') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(initialTheme));

  // Apply to DOM
  const applyTheme = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t);
    setResolvedTheme(resolve(t));
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    window.macterm?.settings.get().then(s => {
      const saved = s?.appearance?.theme || 'dark';
      setThemeState(saved);
      applyTheme(saved);
    });
  }, [applyTheme]);

  // Watch system preference changes when theme = 'system'
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') setResolvedTheme(resolve('system'));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (!THEMES.includes(t)) return;
    setThemeState(t);
    applyTheme(t);
    window.macterm?.settings.save({ appearance: { theme: t } });
  }, [applyTheme]);

  return { theme, setTheme, resolvedTheme };
}

export { THEMES };
