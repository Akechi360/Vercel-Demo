'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Settings as SettingsIcon, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { name: 'General', href: '/settings', icon: SettingsIcon },
  { name: 'Usuarios', href: '/settings/users', icon: Users },
  { name: 'Perfil', href: '/settings/profile', icon: User },
  { name: 'Seguridad', href: '/settings/security', icon: Lock },
  { name: 'Preferencias', href: '/settings/preferences', icon: Shield },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Configuración" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Tabs defaultValue={pathname} orientation="vertical" className="w-full">
            <TabsList className="w-full h-auto flex-col items-start bg-transparent p-0">
              {TABS.map((tab) => (
                 <TabsTrigger
                  key={tab.href}
                  value={tab.href}
                  className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                  asChild
                >
                   <Link href={tab.href}>
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.name}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
