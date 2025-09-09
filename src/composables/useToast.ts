import { ref } from "vue";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: "primary" | "secondary";
  }>;
}

const toasts = ref<Toast[]>([]);
let toastIdCounter = 0;

export function useToast() {
  const addToast = (toast: Omit<Toast, "id">): string => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    toasts.value.push(newToast);

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value = [];
  };

  // Convenience methods
  const success = (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    return addToast({
      type: "success",
      title,
      message,
      ...options,
    });
  };

  const error = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: "error",
      title,
      message,
      duration: 0, // Errors don't auto-dismiss
      ...options,
    });
  };

  const warning = (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => {
    return addToast({
      type: "warning",
      title,
      message,
      ...options,
    });
  };

  const info = (title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({
      type: "info",
      title,
      message,
      ...options,
    });
  };

  return {
    toasts: toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}
