'use client';

import { toast, ToastOptions } from 'react-hot-toast';

type OverlayHandler = (isVisible: boolean) => void;

// Overlay support removed (keeping functions simple)

export function notify(message: string, options?: ToastOptions) {
  const duration = options?.duration ?? 4000;
  return toast(message, { duration, ...options });
}

export function notifySuccess(message: string, options?: ToastOptions) {
  const duration = options?.duration ?? 4000;
  return toast.success(message, { duration, ...options });
}

export function notifyError(message: string, options?: ToastOptions) {
  const duration = options?.duration ?? 4000;
  return toast.error(message, { duration, ...options });
}

// Flash toasts (persist across navigation via sessionStorage)
type FlashToast = { type: 'success' | 'error'; message: string; options?: ToastOptions };
const FLASH_KEY = 'FLASH_TOASTS';

function getFlashQueue(): FlashToast[] {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    return raw ? (JSON.parse(raw) as FlashToast[]) : [];
  } catch {
    return [];
  }
}

function setFlashQueue(queue: FlashToast[]) {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify(queue));
  } catch {}
}

export function flashSuccess(message: string, options?: ToastOptions) {
  const queue = getFlashQueue();
  queue.push({ type: 'success', message, options });
  setFlashQueue(queue);
}

export function flashError(message: string, options?: ToastOptions) {
  const queue = getFlashQueue();
  queue.push({ type: 'error', message, options });
  setFlashQueue(queue);
}

export function drainFlashToasts() {
  const queue = getFlashQueue();
  if (!queue.length) return;
  // Clear first to avoid duplicates if notify throws
  setFlashQueue([]);
  for (const item of queue) {
    if (item.type === 'success') notifySuccess(item.message, item.options);
    else notifyError(item.message, item.options);
  }
}


