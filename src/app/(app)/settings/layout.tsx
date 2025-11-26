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
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configuración" />
      
      <div className="w-full overflow-x-auto pb-2">
        <Tabs defaultValue={pathname} className="w-full">
          <TabsList className="w-full justify-start h-auto bg-transparent p-0 gap-2 border-b rounded-none">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.href}
                value={tab.href}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 transition-all"
                asChild
              >
                <Link href={tab.href} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.name}</span>
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        {children}
      </div>
    </div>
  );
}
