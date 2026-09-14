import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        background: 'var(--color-warning)',
        color: 'var(--color-nav-bg)',
        padding: '0.5rem 1rem',
        fontSize: '0.825rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        zIndex: 9999,
        position: 'sticky',
        top: 0,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <WifiOff size={16} />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
