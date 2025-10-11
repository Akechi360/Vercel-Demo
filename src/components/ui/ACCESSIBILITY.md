# Guía de Accesibilidad para Componentes UI

## Problema Resuelto

Este proyecto tenía warnings de accesibilidad relacionados con `aria-hidden` en modales:

> "Blocked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users."

## Solución Implementada

### 1. Hook de Manejo de Foco (`use-focus-management.ts`)

- **Propósito**: Maneja el foco de manera accesible en modales y dialogs
- **Características**:
  - Previene conflictos con `aria-hidden`
  - Maneja el foco al abrir/cerrar modales
  - Implementa focus trap dentro del modal
  - Restaura el foco al elemento anterior al cerrar

### 2. Dialog Accesible (`accessible-dialog.tsx`)

- **Reemplaza**: `src/components/ui/dialog.tsx`
- **Mejoras**:
  - Manejo automático del foco
  - Prevención de warnings de accesibilidad
  - Focus trap integrado
  - Manejo de tecla Escape

### 3. Componentes Actualizados

Los siguientes componentes ahora usan el Dialog accesible:

- `src/components/patients/patient-list.tsx`
- `src/components/patients/quick-actions.tsx`
- `src/components/patients/add-history-fab.tsx`

## Uso

### Importar el Dialog Accesible

```typescript
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger 
} from '@/components/ui/accessible-dialog';
```

### Ejemplo de Uso

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título del Modal</DialogTitle>
      <DialogDescription>
        Descripción del contenido del modal.
      </DialogDescription>
    </DialogHeader>
    {/* Contenido del modal */}
  </DialogContent>
</Dialog>
```

## Características de Accesibilidad

### ✅ Implementadas

1. **Manejo de Foco**:
   - Auto-focus en el primer elemento interactivo
   - Focus trap dentro del modal
   - Restauración del foco al cerrar

2. **Navegación por Teclado**:
   - Tab/Shift+Tab para navegar
   - Escape para cerrar
   - Focus trap automático

3. **Compatibilidad con Lectores de Pantalla**:
   - No bloquea elementos con `aria-hidden`
   - Manejo correcto de estados de foco
   - Etiquetas accesibles

### 🔧 Configuración Avanzada

```typescript
const { contentRef, closeModal } = useFocusManagement({
  isOpen: true,
  onClose: () => setIsOpen(false),
  triggerRef: triggerRef,
  autoFocus: true // Opcional: auto focus al abrir
});
```

## Testing de Accesibilidad

### Herramientas Recomendadas

1. **Lighthouse**: Audita accesibilidad automáticamente
2. **axe-core**: Detección de problemas de accesibilidad
3. **Lectores de Pantalla**: NVDA, JAWS, VoiceOver

### Checklist de Verificación

- [ ] No hay warnings de `aria-hidden`
- [ ] El foco se maneja correctamente
- [ ] Navegación por teclado funciona
- [ ] Lectores de pantalla pueden acceder al contenido
- [ ] Escape cierra el modal
- [ ] Focus trap funciona correctamente

## Referencias

- [W3C ARIA Guidelines](https://w3c.github.io/aria/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [WebAIM Focus Management](https://webaim.org/techniques/focus/)
