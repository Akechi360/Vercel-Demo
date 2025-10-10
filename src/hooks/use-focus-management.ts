import { useEffect, useRef } from 'react';

interface FocusManagementOptions {
  isOpen: boolean;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
  autoFocus?: boolean;
}

/**
 * Hook para manejar el foco en modales y dialogs de manera accesible
 * Previene warnings de aria-hidden y maneja correctamente el foco
 */
export function useFocusManagement({
  isOpen,
  onClose,
  triggerRef,
  autoFocus = true
}: FocusManagementOptions) {
  const contentRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Guardar el elemento que tenía el foco antes de abrir el modal
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Blur cualquier elemento que tenga foco para evitar conflictos con aria-hidden
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      
      // Auto focus en el contenido del modal si está habilitado
      if (autoFocus && contentRef.current) {
        // Pequeño delay para asegurar que el modal esté completamente renderizado
        const timeoutId = setTimeout(() => {
          const focusableElement = contentRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (focusableElement) {
            focusableElement.focus();
          } else if (contentRef.current) {
            contentRef.current.focus();
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Restaurar el foco al elemento anterior cuando se cierra el modal
      if (previousActiveElement.current) {
        // Pequeño delay para asegurar que el modal esté completamente cerrado
        const timeoutId = setTimeout(() => {
          if (triggerRef?.current) {
            triggerRef.current.focus();
          } else if (previousActiveElement.current) {
            previousActiveElement.current.focus();
          } else {
            document.body.focus();
          }
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen, autoFocus, triggerRef]);

  // Manejar escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        // Blur el elemento activo antes de cerrar
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur();
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Manejar focus trap dentro del modal
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: ir al último elemento si estamos en el primero
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: ir al primer elemento si estamos en el último
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('keydown', handleTabKey);
      return () => content.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  return {
    contentRef,
    // Función para cerrar el modal de manera segura
    closeModal: () => {
      // Blur cualquier elemento que tenga foco
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      onClose?.();
    }
  };
}
