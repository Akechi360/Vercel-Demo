
'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  Calendar,
  Settings,
  Building,
  CreditCard,
  Handshake,
  Shield,
  LogOut,
  UserCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const menuGroups = [
  {
    label: "Principal",
    items: [
      { href: '/dashboard', label: 'Panel de Control', icon: LayoutGrid, permission: 'dashboard:read' },
    ]
  },
  {
    label: "Gestión",
    items: [
      { href: '/patients', label: 'Pacientes', icon: Users, permission: 'patients:read' },
      { href: '/appointments', label: 'Citas Médicas', icon: Calendar, permission: 'appointments:read' },
      { href: '/companies', label: 'Empresas', icon: Building, permission: 'companies:read' },
      { href: '/afiliaciones', label: 'Afiliaciones', icon: Handshake, permission: 'affiliations:read' },
    ]
  },
  {
    label: "Administración",
    items: [
      { href: '/finanzas', label: 'Finanzas', icon: CreditCard, permission: 'finance:read' },
      { href: '/auditoria', label: 'Auditoría', icon: Shield, permission: 'admin:all' },
    ]
  }
];

const settingsMenuItem = { href: '/settings', label: 'Configuración', icon: Settings, permission: 'settings:read' };

export default function Nav() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, loading, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (loading || !currentUser) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border/50 mb-2">
        <div className="flex items-center justify-between w-full px-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg overflow-hidden transition-all duration-300">
            <Image
              src="/images/logo/urovital-logo2.png"
              alt="UroVital"
              width={isCollapsed ? 40 : 140}
              height={isCollapsed ? 40 : 50}
              className={cn(
                "object-contain transition-all duration-300",
                isCollapsed ? "h-10 w-10" : "h-10 w-auto"
              )}
              priority
            />
          </Link>
          {!isCollapsed && <SidebarTrigger className="text-sidebar-foreground/50 hover:text-sidebar-foreground" />}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 gap-0">
        {menuGroups.map((group, groupIndex) => {
          // Check if user has permission for at least one item in the group
          const hasGroupPermission = group.items.some(item => hasPermission(item.permission as any));

          if (!hasGroupPermission) return null;

          return (
            <SidebarGroup key={group.label} className="py-2">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-wider mb-1 px-2">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const canAccess = hasPermission(item.permission as any);
                    if (!canAccess) return null;

                    const active = isActive(item.href);

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={{ children: item.label }}
                          className={cn(
                            "transition-all duration-200 py-2.5",
                            active
                              ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md shadow-blue-900/20 font-medium"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-3">
                            <item.icon className={cn("h-5 w-5", active ? "text-white" : "text-sidebar-foreground/60")} />
                            {!isCollapsed && (
                              <span className="flex-1">{item.label}</span>
                            )}
                            {!isCollapsed && active && (
                              <ChevronRight className="h-4 w-4 text-white/50" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {groupIndex < menuGroups.length - 1 && <SidebarSeparator className="my-2 opacity-50" />}
            </SidebarGroup>
          );
        })}

        {hasPermission(settingsMenuItem.permission as any) && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(settingsMenuItem.href)}
                    tooltip={{ children: settingsMenuItem.label }}
                    className={cn(
                      "transition-all duration-200 py-2.5",
                      isActive(settingsMenuItem.href)
                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-md"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Link href={settingsMenuItem.href} className="flex items-center gap-3">
                      <Settings className={cn("h-5 w-5", isActive(settingsMenuItem.href) ? "text-white" : "text-sidebar-foreground/60")} />
                      {!isCollapsed && <span>{settingsMenuItem.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50 bg-black/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-sidebar-border">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=0D8ABC&color=fff`} />
              <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{currentUser.name}</span>
              <span className="text-xs text-sidebar-foreground/50 truncate capitalize">{currentUser.role.toLowerCase()}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8 border border-sidebar-border">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=0D8ABC&color=fff`} />
              <AvatarFallback><UserCircle className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </>
  );
}
