import { useThemeStore, ThemePreference } from '../store/themeStore';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  variant?: 'icon-btn' | 'row' | 'pill';
  className?: string;
  onSelect?: () => void;
}

export function ThemeToggle({ variant = 'icon-btn', className = '', onSelect }: ThemeToggleProps) {
  const { themePreference, resolvedTheme, setTheme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  const handleToggle = () => {
    toggleTheme();
    onSelect?.();
  };

  const getLabel = (pref: ThemePreference) => {
    if (pref === 'dark') return t('nav.themeDark', 'Dark');
    if (pref === 'light') return t('nav.themeLight', 'Light');
    return 'System';
  };

  if (variant === 'row') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 10px',
          borderRadius: '6px',
          fontSize: '12.5px',
          color: 'var(--text)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {resolvedTheme === 'dark' ? (
            <Sun size={14} color="var(--accent-hi)" />
          ) : (
            <Moon size={14} color="var(--text-muted)" />
          )}
          <span>{t('nav.theme', 'Theme')}</span>
        </span>

        {/* 3-State Segmented Selector */}
        <div
          role="radiogroup"
          aria-label={t('nav.themeToggleAria', 'Theme preference')}
          style={{
            display: 'inline-flex',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '2px',
            borderRadius: '6px',
            gap: '2px',
          }}
        >
          {(['light', 'system', 'dark'] as ThemePreference[]).map((mode) => {
            const isSelected = themePreference === mode;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(mode);
                  onSelect?.();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? 'var(--on-primary)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                }}
              >
                {mode === 'light' && <Sun size={11} />}
                {mode === 'system' && <Monitor size={11} />}
                {mode === 'dark' && <Moon size={11} />}
                <span>{getLabel(mode)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Floating pill or header icon button
  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t('nav.themeToggleAria', 'Toggle color theme')}
      aria-pressed={resolvedTheme === 'dark'}
      title={`${t('nav.theme', 'Theme')}: ${getLabel(themePreference)} (${resolvedTheme})`}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: variant === 'pill' ? '50%' : '6px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: 'var(--panel-text)',
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={14} color="var(--accent-hi)" />
      ) : (
        <Moon size={14} color="var(--panel-text-2)" />
      )}
    </button>
  );
}
