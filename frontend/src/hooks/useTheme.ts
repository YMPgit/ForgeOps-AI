import { useEffect, useState } from 'react';
import { loadAppSettings, saveAppSettings, applyTheme, type AppSettings } from '@/lib/appSettings';

export function useTheme() {
  const [theme, setTheme] = useState<AppSettings['theme']>(() => loadAppSettings().theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      const settings = loadAppSettings();
      saveAppSettings({ ...settings, theme: next });
      return next;
    });
  };

  const setThemeValue = (value: AppSettings['theme']) => {
    setTheme(value);
    const settings = loadAppSettings();
    saveAppSettings({ ...settings, theme: value });
  };

  return { toggleTheme, theme, setTheme: setThemeValue, isDark: theme === 'dark' };
}