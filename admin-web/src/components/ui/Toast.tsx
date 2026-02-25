import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-right-full duration-300',
              t.type === 'success' &&
                'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-default)]',
              t.type === 'error' &&
                'bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/90 dark:text-red-100 dark:border-red-800',
              t.type === 'info' &&
                'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-default)]'
            )}
          >
            {t.type === 'success' && (
              <CheckCircle size={18} className="shrink-0" />
            )}
            {t.type === 'error' && (
              <AlertCircle size={18} className="shrink-0" />
            )}
            {t.type === 'info' && <Info size={18} className="shrink-0" />}
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 hover:opacity-70"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
