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
    <div className="flex flex-col gap-8">
      <PageHeader title="Configuración" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border bg-card shadow-sm p-2">
            <Tabs defaultValue={pathname} orientation="vertical" className="w-full">
              <TabsList className="w-full h-auto flex-col items-stretch bg-transparent p-0 gap-1">
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.href}
                    value={tab.href}
                    className="w-full justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-3 transition-all"
                    asChild
                  >
                    <Link href={tab.href} className="flex items-center gap-3">
                      <tab.icon className="h-4 w-4" />
                      <span className="font-medium">{tab.name}</span>
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
