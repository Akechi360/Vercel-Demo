'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function useThemeDetection() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return 'dark'; // Default to dark theme during SSR
  }

  // Determine the actual theme being used
  const actualTheme = theme === 'system' ? systemTheme : theme;
  return actualTheme || 'dark';
}

export function getSweetAlertTheme() {
  const { theme, systemTheme } = useTheme();
  
  // Determine the actual theme being used
  const actualTheme = theme === 'system' ? systemTheme : theme;
  const isDark = actualTheme === 'dark';

  return {
    isDark,
    theme: actualTheme || 'dark',
    colors: {
      // Light theme colors
      light: {
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
      },
      // Dark theme colors
      dark: {
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
      }
    }
  };
}
