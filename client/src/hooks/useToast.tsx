import { useState } from 'react';
import Toast from '../components/Toast';

interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<(ToastConfig & { id: number })[]>([]);

  const showToast = (config: ToastConfig) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...config, id }]);
  };

  const closeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => closeToast(toast.id)}
        />
      ))}
    </>
  );

  return {
    success: (message: string, duration?: number) => showToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => showToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => showToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => showToast({ message, type: 'warning', duration }),
    ToastContainer
  };
};
