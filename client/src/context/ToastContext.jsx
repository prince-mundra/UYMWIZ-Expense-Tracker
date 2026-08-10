import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl
            border cursor-pointer min-w-[280px] max-w-xs backdrop-blur-sm
            ${t.type === 'success'
              ? 'bg-teal/10 border-teal/30 text-teal-400'
              : t.type === 'error'
              ? 'bg-rose/10 border-rose/30 text-rose'
              : 'bg-amber/10 border-amber/30 text-amber'
            }`}
          onClick={() => onRemove(t.id)}
        >
          <span className="text-lg">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '⚠'}
          </span>
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <span className="text-xs opacity-60">×</span>
        </div>
      ))}
    </div>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
