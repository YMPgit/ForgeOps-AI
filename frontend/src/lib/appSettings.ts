import { scopeKey } from '@/lib/userScope';

export interface AppSettings {
  temperature: number;
  maxTokens: number;
  defaultChartType: 'auto' | 'bar' | 'line' | 'pie' | 'table';
  theme: 'light' | 'dark' | 'system';
}

const STORAGE_KEY = () => scopeKey('talk-to-data-settings');

const DEFAULTS: AppSettings = {
  temperature: 0.1,
  maxTokens: 1024,
  defaultChartType: 'auto',
  theme: 'light',
};

export function loadAppSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY());
    if (saved) {
      return { ...DEFAULTS, ...JSON.parse(saved) };
    }
  } catch {}
  return { ...DEFAULTS };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY(), JSON.stringify(settings));
}

export function applyTheme(theme: AppSettings['theme']): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}