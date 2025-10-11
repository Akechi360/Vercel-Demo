'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = (patientId: string) => [
  { name: 'Historial Médico', href: `/patients/${patientId}` },
  { name: 'Resumen', href: `/patients/${patientId}/summary` },
  { name: 'Datos Urológicos', href: `/patients/${patientId}/urology` },
  { name: 'Informes', href: `/patients/${patientId}/reports` },
];

export default function PatientDetailNav({ patientId }: { patientId: string }) {
  const pathname = usePathname();
  
  return (
    <Tabs defaultValue={pathname} className="w-full">
      <TabsList>
        {TABS(patientId).map((tab) => (
            <TabsTrigger key={tab.href} value={tab.href} asChild>
              <Link href={tab.href}>{tab.name}</Link>
            </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
