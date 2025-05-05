import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

// Global toast management (singleton)
const toasts: Toast[] = [];
let listeners: (() => void)[] = [];

// Helper functions for managing toasts
export const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: Toast = {
    id,
    message,
    type,
    timestamp: Date.now()
  };
  
  toasts.unshift(newToast);
  // Keep only the latest 5 toasts
  if (toasts.length > 5) {
    toasts.pop();
  }
  
  // Notify all listeners
  listeners.forEach(listener => listener());
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
  
  return id;
};

export const removeToast = (id: string) => {
  const index = toasts.findIndex(toast => toast.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    // Notify all listeners
    listeners.forEach(listener => listener());
  }
};

const ToastCenter = () => {
  const [localToasts, setLocalToasts] = useState<Toast[]>([...toasts]);
  
  useEffect(() => {
    // Register listener for toast changes
    const updateToasts = () => {
      setLocalToasts([...toasts]);
    };
    
    listeners.push(updateToasts);
    
    return () => {
      // Remove listener on unmount
      listeners = listeners.filter(listener => listener !== updateToasts);
    };
  }, []);
  
  if (localToasts.length === 0) return null;
  
  return (
    <div className="toast-center">
      {localToasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && '✅ '}
            {toast.type === 'error' && '❌ '}
            {toast.type === 'warning' && '⚠️ '}
            {toast.type === 'info' && 'ℹ️ '}
            {toast.message}
          </div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastCenter; 