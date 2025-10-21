'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface SweetAlertTheme {
  popup: string;
  backdrop: string;
  title: string;
  content: string;
  confirmButton: string;
  confirmButtonHover: string;
  cancelButton: string;
  cancelButtonHover: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export function useSweetAlertTheme() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return getDarkTheme();
  }

  // Determine the actual theme being used
  const actualTheme = theme === 'system' ? systemTheme : theme;
  const isDark = actualTheme === 'dark';

  return isDark ? getDarkTheme() : getLightTheme();
}

function getLightTheme(): SweetAlertTheme {
  return {
    popup: '#ffffff',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    title: '#1f2937',
    content: '#374151',
    confirmButton: '#2563eb',
    confirmButtonHover: '#1d4ed8',
    cancelButton: '#6b7280',
    cancelButtonHover: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
}

function getDarkTheme(): SweetAlertTheme {
  return {
    popup: '#1f2937',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    title: '#f9fafb',
    content: '#d1d5db',
    confirmButton: '#3b82f6',
    confirmButtonHover: '#2563eb',
    cancelButton: '#6b7280',
    cancelButtonHover: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };
}

export function getSweetAlertConfig(theme: SweetAlertTheme) {
  return {
    customClass: {
      popup: 'swal2-popup-theme',
      title: 'swal2-title-theme',
      content: 'swal2-content-theme',
      confirmButton: 'swal2-confirm-theme',
      cancelButton: 'swal2-cancel-theme',
      actions: 'swal2-actions-theme',
    },
    didOpen: () => {
      // Apply theme-specific styles
      const popup = document.querySelector('.swal2-popup') as HTMLElement;
      if (popup) {
        popup.style.backgroundColor = theme.popup;
        popup.style.color = theme.content;
        popup.style.border = `1px solid ${theme.content}`;
      }

      const title = document.querySelector('.swal2-title') as HTMLElement;
      if (title) {
        title.style.color = theme.title;
      }

      const content = document.querySelector('.swal2-content') as HTMLElement;
      if (content) {
        content.style.color = theme.content;
      }

      const confirmButton = document.querySelector('.swal2-confirm') as HTMLElement;
      if (confirmButton) {
        confirmButton.style.backgroundColor = theme.confirmButton;
        confirmButton.style.borderColor = theme.confirmButton;
        confirmButton.style.color = '#ffffff';
        confirmButton.addEventListener('mouseenter', () => {
          confirmButton.style.backgroundColor = theme.confirmButtonHover;
        });
        confirmButton.addEventListener('mouseleave', () => {
          confirmButton.style.backgroundColor = theme.confirmButton;
        });
      }

      const cancelButton = document.querySelector('.swal2-cancel') as HTMLElement;
      if (cancelButton) {
        cancelButton.style.backgroundColor = theme.cancelButton;
        cancelButton.style.borderColor = theme.cancelButton;
        cancelButton.style.color = '#ffffff';
        cancelButton.addEventListener('mouseenter', () => {
          cancelButton.style.backgroundColor = theme.cancelButtonHover;
        });
        cancelButton.addEventListener('mouseleave', () => {
          cancelButton.style.backgroundColor = theme.cancelButton;
        });
      }
    }
  };
}

// Función específica para alertas de confirmación con colores de advertencia
export function getSweetAlertWarningConfig(theme: SweetAlertTheme) {
  return {
    ...getSweetAlertConfig(theme),
    didOpen: () => {
      // Apply base theme styles
      getSweetAlertConfig(theme).didOpen?.();
      
      // Override confirm button for warning/delete actions
      const confirmButton = document.querySelector('.swal2-confirm') as HTMLElement;
      if (confirmButton) {
        confirmButton.style.backgroundColor = theme.error;
        confirmButton.style.borderColor = theme.error;
        confirmButton.addEventListener('mouseenter', () => {
          confirmButton.style.backgroundColor = '#dc2626'; // Darker red on hover
        });
        confirmButton.addEventListener('mouseleave', () => {
          confirmButton.style.backgroundColor = theme.error;
        });
      }
    }
  };
}
