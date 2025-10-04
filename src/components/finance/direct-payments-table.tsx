// src/components/admin/finance/direct-payments.tsx
export default function DirectPayments() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">[OBSOLETO] Pagos Directos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Esta vista ya no está activa. Usa el módulo independiente:
        <span className="ml-1 font-medium">Finanzas → Pagos Directos</span>
        (ruta <code className="mx-1 rounded bg-slate-100 px-1">/finanzas/pagos</code>).
      </p>
    </div>
  );
}
