
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
import { Moon, Sun, User, LogOut, Settings, PanelLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from './auth-provider';
import type { User as UserType } from '@/lib/types';

const getGreeting = (currentUser: UserType | null): string => {
    if (!currentUser) return '';

    switch(currentUser.role) {
        case 'admin':
            return 'Bienvenido, Admin';
        case 'doctor':
            return `Bienvenido, Dr. ${currentUser.name}`;
        case 'secretaria':
            return 'Bienvenid@, Secretaria';
        case 'patient':
            return `Bienvenido, ${currentUser.name}`;
        default:
            return `Bienvenido, ${currentUser.name || 'Usuario'}`;
    }
};

export default function AppHeader() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { toggleSidebar, isMobile, state } = useSidebar();
  const { currentUser } = useAuth();
  const isCollapsed = state === 'collapsed';


  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/landing');
  };

  const greeting = getGreeting(currentUser);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
       {(isMobile || isCollapsed) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0"
          >
            <PanelLeft className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {greeting && (
            <span className="hidden sm:block text-sm font-medium text-muted-foreground">
                {greeting}
            </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentUser ? currentUser.name.charAt(0) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
