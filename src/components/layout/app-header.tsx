
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, User, LogOut, Settings, PanelLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from './auth-provider';
import { ROLES } from '@/lib/types';
import NotificationBell from '@/components/notifications/notification-bell';
export default function AppHeader() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, isMobile, state } = useSidebar();
  const { currentUser } = useAuth();
  const isCollapsed = state === 'collapsed';

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/landing');
  };

  // Generate breadcrumbs
  const segments = pathname ? pathname.split('/').filter(Boolean) : [];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-card/80 px-6 backdrop-blur-xl shadow-sm transition-all duration-300">
      {(isMobile || isCollapsed) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <PanelLeft className="h-6 w-6" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}


      {/* Search Bar */}
      <div className="flex-1 flex items-center max-w-md">
        <div className="relative w-full hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
          <Input
            placeholder="Buscar..."
            className="pl-10 h-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-300 rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-300"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="relative">
          <NotificationBell />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 p-0 overflow-hidden">
              <Avatar className="h-full w-full">
                {currentUser?.role === ROLES.DOCTOR && currentUser?.avatarUrl ? (
                  <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {currentUser ? currentUser.name.charAt(0) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2 rounded-xl shadow-xl border-border/50 bg-card/95 backdrop-blur-md" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-3 bg-muted/30 rounded-lg mb-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-primary">{currentUser?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push('/settings/profile')} className="rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-2 bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
