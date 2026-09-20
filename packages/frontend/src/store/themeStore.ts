import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? getSystemTheme() : pref;
}

function applyThemeToDOM(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Update theme-color meta tag
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', resolved === 'dark' ? '#1C1715' : '#FDFBF6');
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem('theme') || localStorage.getItem('govlink_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved as ThemePreference;
    }
  } catch {
    // fallback
  }
  return 'system';
}

const initialPref = getInitialPreference();
const initialResolved = resolveTheme(initialPref);
applyThemeToDOM(initialResolved);

// Listen to OS changes when in system mode
if (typeof window !== 'undefined' && window.matchMedia) {
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      const currentPref = (localStorage.getItem('theme') || 'system') as ThemePreference;
      if (currentPref === 'system') {
        const nextResolved = getSystemTheme();
        applyThemeToDOM(nextResolved);
        useThemeStore.setState({ resolvedTheme: nextResolved });
      }
    });
  } catch {
    // ignore older browsers
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themePreference: initialPref,
  resolvedTheme: initialResolved,
  setTheme: (pref: ThemePreference) => {
    try {
      localStorage.setItem('theme', pref);
      localStorage.setItem('govlink_theme', pref);
    } catch {}
    const resolved = resolveTheme(pref);
    applyThemeToDOM(resolved);
    set({ themePreference: pref, resolvedTheme: resolved });
  },
  toggleTheme: () => {
    // Cycles: system -> light -> dark (or light <-> dark if preferred)
    const current = get().resolvedTheme;
    const next: ThemePreference = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
