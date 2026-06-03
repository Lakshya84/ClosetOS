import React, { useState, useEffect } from 'react';
import { X, Bell, Trash2, Eye, RefreshCw, AlertTriangle, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export default function NotificationDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { authFetch } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await authFetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        showToast('Notification cleared', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await authFetch('/api/notifications/read-all', {
        method: 'PATCH'
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        showToast('All notifications cleared', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        showToast('Alert deleted from archive', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WIPE ENTIRE NOTIFICATION HISTORY? THIS ACTION IS IRREVERSIBLE.')) return;
    try {
      const res = await authFetch('/api/notifications', {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications([]);
        showToast('Notification history wiped', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div class="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        class="absolute inset-0 bg-[#000000]/70 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Drawer Panel */}
      <div class="relative w-full max-w-md bg-vault-card border-l border-neutral-900 h-full flex flex-col z-10 shadow-2xl">
        {/* Top green edge line */}
        <div class="absolute top-0 bottom-0 left-0 w-[2px] bg-vault-lime"></div>

        {/* Drawer Header */}
        <div class="p-6 border-b border-neutral-900 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Bell class="w-4 h-4 text-vault-lime animate-pulse" />
            <div>
              <h2 class="text-sm font-bold tracking-widest text-vault-primary uppercase font-mono">
                // SYSTEM LOGS
              </h2>
              <p class="text-[9px] font-mono text-vault-muted uppercase">
                REAL-TIME CUSTODY & AUDIT NOTIFICATIONS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            class="text-vault-muted hover:text-vault-lime p-1 transition-colors"
          >
            <X class="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Action Controls */}
        {notifications.length > 0 && (
          <div class="px-6 py-3 bg-neutral-950/50 border-b border-neutral-900 flex items-center justify-between text-[10px] font-mono">
            <button
              onClick={handleMarkAllRead}
              class="text-vault-lime hover:underline flex items-center gap-1 uppercase"
            >
              <Eye class="w-3 h-3" />
              MARK ALL READ
            </button>
            
            <button
              onClick={handleClearAll}
              class="text-vault-muted hover:text-vault-red flex items-center gap-1 uppercase transition-colors"
            >
              <Trash2 class="w-3 h-3" />
              FLUSH ENTIRE HISTORY
            </button>
          </div>
        )}

        {/* Notifications Timeline List */}
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && notifications.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-20 font-mono text-[10px] text-vault-muted uppercase">
              <RefreshCw class="w-5 h-5 animate-spin mb-3 text-vault-lime" />
              DECRYPTING SYSTEM AUDITS...
            </div>
          ) : notifications.length === 0 ? (
            <div class="text-center py-32 font-mono text-[10px] text-vault-muted uppercase border border-dashed border-neutral-900 p-6">
              <Bell class="w-6 h-6 text-neutral-800 mx-auto mb-4" />
              NO SYSTEM LOGS RECORDED. <br />VAULT ACTIVITY SETTLED.
            </div>
          ) : (
            <div class="space-y-4">
              {notifications.map((n) => {
                const isOverdue = n.type === 'OVERDUE';
                const isUnread = !n.read;

                return (
                  <div
                    key={n._id}
                    class={`p-4 border transition-all relative ${
                      isUnread
                        ? isOverdue
                          ? 'border-vault-red bg-vault-red/5'
                          : 'border-vault-lime/30 bg-vault-lime/5'
                        : 'border-neutral-900 bg-neutral-950/20'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span class={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full ${
                        isOverdue ? 'bg-vault-red' : 'bg-vault-lime'
                      }`}></span>
                    )}

                    <div class="space-y-1.5">
                      <div class="flex items-center gap-2">
                        <span class={`text-[9px] font-mono px-2 py-0.5 border ${
                          isOverdue 
                            ? 'border-vault-red text-vault-red bg-vault-red/10' 
                            : 'border-neutral-800 text-vault-muted bg-neutral-950'
                        }`}>
                          {n.type}
                        </span>

                        <span class="text-[9px] font-mono text-neutral-600">
                          {formatDate(n.createdAt)} @ {formatTime(n.createdAt)}
                        </span>
                      </div>

                      <h4 class={`text-xs font-bold uppercase tracking-wide font-mono ${
                        isOverdue ? 'text-vault-red' : 'text-vault-primary'
                      }`}>
                        {n.title}
                      </h4>

                      <p class="text-[11px] font-sans text-vault-primary leading-relaxed uppercase">
                        {n.message}
                      </p>

                      <div class="pt-2 border-t border-neutral-900/50 flex justify-end gap-3 text-[9px] font-mono">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            class="text-vault-lime hover:underline"
                          >
                            DISMISS
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(n._id)}
                          class="text-vault-muted hover:text-vault-red transition-colors"
                        >
                          DELETE LOG
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info tag */}
        <div class="p-6 border-t border-neutral-900 text-center text-[8px] font-mono text-vault-muted tracking-widest uppercase bg-neutral-950/30">
          SECURE AUDIT ARCHIVE // CLOSETOS KERNEL
        </div>
      </div>
    </div>
  );
}
