
'use client';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  Users,
  Calendar,
  Settings,
  Stethoscope,
  PanelLeft,
  Building,
  Box,
  Truck,
  Bell,
  ChevronDown,
  CreditCard,
  Handshake,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { AnimatePresence, motion } from 'framer-motion';

const mainMenuItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutGrid, permission: 'dashboard:read' },
  { href: '/patients', label: 'Pacientes', icon: Users, permission: 'patients:read' },
  { href: '/companies', label: 'Empresas', icon: Building, permission: 'companies:read' },
  { href: '/appointments', label: 'Citas', icon: Calendar, permission: 'appointments:read' },
  { href: '/finanzas', label: 'Finanzas', icon: CreditCard, permission: 'finance:read' },
  { href: '/afiliaciones', label: 'Afiliaciones', icon: Handshake, permission: 'affiliations:read' },
  { href: '/auditoria', label: 'Auditoría', icon: Shield, permission: 'admin:all' },
];


const settingsMenuItem = { href: '/settings', label: 'Configuración', icon: Settings, permission: 'settings:read' };

export default function Nav() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, loading } = useAuth();
  const { hasPermission, canAccessModule } = usePermissions();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  

  // Don't render navigation until user is loaded
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
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Image
              src="/images/logo/urovital-logo2.png"
              alt="UroVital"
              width={isCollapsed ? 57 : 67}
              height={isCollapsed ? 57 : 67}
              className={isCollapsed ? "h-14 w-14 object-contain" : "h-16 w-auto object-contain"}
              priority
            />
          </Link>
          {!isCollapsed && <SidebarTrigger>
             <PanelLeft />
          </SidebarTrigger>}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainMenuItems.map((item) => {
            const canAccess = hasPermission(item.permission as any);
            return canAccess && (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                   {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            );
          })}
            

          {hasPermission(settingsMenuItem.permission as any) && <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive(settingsMenuItem.href)}
                tooltip={{ children: settingsMenuItem.label }}
              >
                <Link href={settingsMenuItem.href}>
                  <Settings />
                  {!isCollapsed && <span>{settingsMenuItem.label}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {/* Can add footer content here */}
      </SidebarFooter>
    </>
  );
}
