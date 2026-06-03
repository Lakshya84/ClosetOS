import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Trigger a Toast popup alert
  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Automatically remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global Float Toast Container */}
      <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full font-sans pointer-events-none">
        {toasts.map((toast) => {
          let icon = <Info class="w-4 h-4 text-vault-lime" />;
          let borderClass = 'border-vault-lime/30';
          let bgClass = 'bg-vault-card/95';
          let textColor = 'text-vault-primary';

          if (toast.type === 'error') {
            icon = <AlertCircle class="w-4 h-4 text-vault-red" />;
            borderClass = 'border-vault-red/50';
            textColor = 'text-vault-red';
            bgClass = 'bg-vault-red/5';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle class="w-4 h-4 text-orange-500" />;
            borderClass = 'border-orange-500/35';
            textColor = 'text-orange-500';
          } else if (toast.type === 'success') {
            icon = <CheckCircle class="w-4 h-4 text-vault-lime" />;
            borderClass = 'border-vault-lime';
          }

          return (
            <div
              key={toast.id}
              class={`pointer-events-auto border flex items-center justify-between p-4 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${borderClass} ${bgClass}`}
              style={{
                animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div class="flex items-center gap-3">
                <div class="shrink-0">{icon}</div>
                <p class={`text-xs font-mono uppercase tracking-wide leading-relaxed ${textColor}`}>
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                class="text-vault-muted hover:text-vault-primary ml-4 shrink-0 transition-colors"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Inject css animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
