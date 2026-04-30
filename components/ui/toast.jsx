"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { id, ...t }]);
    const timeout = setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), (t.duration || 5000));
    return () => clearTimeout(timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[9999]">
        {toasts.map((t) => (
          <div key={t.id} className="bg-white border px-4 py-2 rounded shadow text-sm flex items-start gap-3">
            <div className="flex-1">
              <div className="font-semibold">{t.title}</div>
              {t.description && <div className="text-xs text-gray-600">{t.description}</div>}
            </div>
            {t.action && (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    try {
                      t.action.onClick && t.action.onClick();
                    } catch (e) {
                      console.error('toast action error', e);
                    }
                    setToasts((s) => s.filter((x) => x.id !== t.id));
                  }}
                  className="text-sm text-blue-600 px-2 py-1"
                >
                  {t.action.label || 'Action'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { push: (t) => window.alert(t.title) };
  return { push: ctx.push };
}
