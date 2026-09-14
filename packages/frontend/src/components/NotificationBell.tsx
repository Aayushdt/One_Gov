import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../hooks/useApi';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  metadata?: any;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore when unauthenticated or offline
    }
  };

  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem('govlink_token');
    let es: EventSource | null = null;

    if (token) {
      try {
        es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);
        es.onmessage = (event) => {
          if (!event.data) return;
          try {
            const newNotif: NotificationItem = JSON.parse(event.data);
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
            setUnreadCount((prev) => prev + 1);
          } catch {
            // Ignore non-JSON or heartbeat
          }
        };
      } catch {
        // Fall back gracefully to polling
      }
    }

    const interval = setInterval(fetchNotifications, 15000); // 15s background fallback
    return () => {
      clearInterval(interval);
      if (es) {
        es.close();
      }
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'WORKFLOW_COMPLETED':
        return <CheckCircle2 size={16} color="var(--color-success)" />;
      case 'CONSENT_EXPIRING':
      case 'CONSENT_EXPIRING_SOON':
        return <AlertTriangle size={16} color="var(--color-warning)" />;
      case 'CONSENT_REVOKED':
      case 'WORKFLOW_FAILED':
        return <ShieldAlert size={16} color="var(--color-error)" />;
      default:
        return <Clock size={16} color="var(--color-accent-primary)" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)',
          transition: 'color var(--duration-fast)',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '36px',
            width: '360px',
            maxHeight: '440px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-bg-sunken)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-accent-primary)',
                    color: 'var(--color-text-inverse)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      background: isUnread ? 'rgba(229, 71, 45, 0.06)' : 'transparent',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'background var(--duration-fast)',
                    }}
                  >
                    <div style={{ marginTop: '2px', flexShrink: 0 }}>{getIcon(item.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: isUnread ? 600 : 500,
                          color: 'var(--color-text-primary)',
                          marginBottom: '2px',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          lineHeight: '1.4',
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.body}
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '4px',
                        }}
                      >
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkRead(item.id, e)}
                        title="Mark as read"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-text-tertiary)',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '4px',
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
