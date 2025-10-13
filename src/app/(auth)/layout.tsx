export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo degradado institucional UroVital */}
      <div className="absolute inset-0 bg-gradient-to-br from-urovital-blue-light/10 via-urovital-blue/5 to-white dark:from-[#0a1429] dark:via-[#131c36] dark:to-[#071f3d]"></div>
      
      {/* Elementos decorativos sutiles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* Círculo decorativo superior izquierdo */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-urovital-blue/10 dark:bg-urovital-blue/5 blur-3xl"></div>
        
        {/* Círculo decorativo inferior derecho */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-urovital-blue/5 dark:bg-urovital-blue/10 blur-3xl"></div>
        
        {/* Patrón de puntos sutiles */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-urovital-blue"></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-urovital-blue"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-urovital-blue"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full bg-urovital-blue"></div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
