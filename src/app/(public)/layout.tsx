
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
    <div className="flex min-h-screen flex-col bg-background text-foreground font-body">
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
                        <SheetContent side="left">
                            <SheetHeader>
                                <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                            </SheetHeader>
                             <nav className="flex flex-col gap-4 mt-8">
                                {NAV_LINKS.map(link => (
                                    <Button key={link.href} asChild variant="ghost" className={cn(
                                        "justify-start text-lg hover:text-white hover:bg-primary/20",
                                        (pathname === link.href || (link.href !== '/landing' && pathname.startsWith(link.href))) && "text-primary"
                                    )}>
                                        <Link href={link.href}>{link.label}</Link>
                                    </Button>
                                ))}
                            </nav>
                             <div className="mt-8 pt-4 border-t flex flex-col gap-3">
                                {isAuthenticated ? (
                                    <Button asChild size="lg" className="w-full">
                                        <Link href="/dashboard">Ir al Panel</Link>
                                    </Button>
                                ) : (
                                    <Button asChild size="lg" className="w-full">
                                    <Link href="/afiliacion">Afíliate Ahora</Link>
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="lg" className="w-full">
                                    <Link href="/login">
                                        Iniciar Sesión
                                    </Link>
                                </Button>
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
