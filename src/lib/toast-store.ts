"use client";

import { useCallback, useEffect, useState } from "react";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

export interface Toast extends ToastInput {
  id: string;
}

const listeners = new Set<() => void>();
let toasts: Toast[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getToasts(): Toast[] {
  return toasts;
}

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pushToast(input: ToastInput): void {
  const toast: Toast = { ...input, id: generateToastId() };
  toasts = [...toasts, toast];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    emit();
  }, 3200);
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast(): {
  toasts: Toast[];
  showToast: (input: ToastInput) => void;
} {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    pushToast(input);
  }, []);

  return { toasts: getToasts(), showToast };
}