
'use client';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/layout/auth-provider";
import { Mail, Phone, MapPin, Clock, Menu, Sun, Moon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import 'animate.css';
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from 'react';
import Footer from "@/components/layout/footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";


const NAV_LINKS = [
  { href: "/landing", label: "Inicio" },
  { href: "/directorio", label: "Directorio" },
  { href: "/estudios", label: "Estudios" },
]

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const showLandingHeader = pathname === '/landing';

  useEffect(() => {
    if (!showLandingHeader) {
      setScrolled(false);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showLandingHeader]);

  return (
    <div className="flex min-h-screen flex-col text-foreground font-body">
      {showLandingHeader && (
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-background/80 shadow-md backdrop-blur-sm" : "bg-transparent"
        )}>
          {/* Top Bar */}
          <div className="bg-[#EBF1F8] dark:bg-gray-900/50 text-xs text-gray-600 dark:text-gray-300">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>+58 412-177 2206</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Mail size={14} />
                  <span>info@urovital.com</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2">
                  <Clock size={14} />
                  <span>Horario: Lun - Vie: 9am - 5pm</span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <MapPin size={14} />
                  <span>Valencia, Edo. Carabobo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <Link href="/landing" className="flex items-center gap-2 font-bold text-lg">
                <Image
                  src="/images/logo/urovital-logo.png"
                  alt="UroVital"
                  width={251}
                  height={89}
                  className="h-12 w-auto object-contain"
                  priority
                />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-2">
                {NAV_LINKS.map(link => (
                  <Button key={link.href} asChild variant="ghost" className={cn(
                    "font-semibold text-foreground/80 hover:text-white hover:bg-primary/20",
                    (pathname === link.href || (link.href !== '/landing' && pathname.startsWith(link.href))) && "text-primary"
                  )}>
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </nav>

              {/* Mobile Nav Trigger */}
              <div className="lg:hidden">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] border-r border-white/10 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 p-0">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none" />

                    <SheetHeader className="p-6 border-b border-white/10 relative z-10">
                      <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                      <Image
                        src="/images/logo/urovital-logo.png"
                        alt="UroVital"
                        width={180}
                        height={64}
                        className="h-10 w-auto object-contain brightness-0 invert"
                        priority
                      />
                    </SheetHeader>

                    <div className="flex flex-col h-full relative z-10 overflow-y-auto">
                      <nav className="flex flex-col gap-2 p-6">
                        {NAV_LINKS.map(link => {
                          const isActive = pathname === link.href || (link.href !== '/landing' && pathname.startsWith(link.href));
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setIsMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "text-blue-100/60 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <span className={cn(
                                "text-lg font-medium",
                                isActive && "bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-bold"
                              )}>
                                {link.label}
                              </span>
                              {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                              )}
                            </Link>
                          );
                        })}
                      </nav>

                      <div className="mt-6 p-6 flex flex-col gap-4">
                        {isAuthenticated ? (
                          <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/20">
                            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Ir al Panel</Link>
                          </Button>
                        ) : (
                          <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/20">
                            <Link href="/afiliacion" onClick={() => setIsMenuOpen(false)}>Afíliate Ahora</Link>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="lg" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                          <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                            Iniciar Sesión
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Desktop actions */}
              <div className="hidden lg:flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Cambiar tema</span>
                </Button>
                {isAuthenticated ? (
                  <Button asChild>
                    <Link href="/dashboard">Ir al Panel</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/afiliacion">Afíliate Ahora</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/login">
                    Iniciar Sesión
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}


      <main className={cn("flex-1", !showLandingHeader && 'pt-16')}>
        {children}
      </main>

      <Footer />
    </div>
  );
}
