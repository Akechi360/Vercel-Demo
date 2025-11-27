export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo degradado institucional UroVital mejorado */}
      <div className="absolute inset-0 bg-gradient-to-br from-urovital-blue/15 via-urovital-blue-light/8 to-white dark:from-[#0a1429] dark:via-[#131c36] dark:to-[#071f3d]"></div>

      {/* Elementos decorativos mejorados */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* Círculo decorativo superior izquierdo más prominente */}
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-urovital-blue/12 dark:bg-urovital-blue/8 blur-3xl"></div>

        {/* Círculo decorativo inferior derecho más prominente */}
        <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-urovital-blue/8 dark:bg-urovital-blue/12 blur-3xl"></div>

        {/* Círculo central decorativo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-urovital-blue/5 dark:bg-urovital-blue/8 blur-3xl"></div>

        {/* Líneas decorativas sutiles */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-urovital-blue/20 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-urovital-blue/20 to-transparent"></div>

        {/* Patrón de puntos sutiles mejorado */}
        <div className="absolute inset-0 opacity-8 dark:opacity-12">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-urovital-blue/30"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-urovital-blue/25"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 rounded-full bg-urovital-blue/30"></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-urovital-blue/25"></div>
          <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 rounded-full bg-urovital-blue/20"></div>
          <div className="absolute top-2/3 right-1/6 w-1 h-1 rounded-full bg-urovital-blue/20"></div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-6xl">
        {children}
      </div>
    </main>
  );
}
