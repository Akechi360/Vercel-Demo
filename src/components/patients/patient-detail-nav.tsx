'use client';

import { Tabs, Tab } from "@heroui/react";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TABS = (patientId: string) => [
  { id: 'historial', name: 'Historial Médico', href: `/patients/${patientId}` },
  { id: 'resumen', name: 'Resumen', href: `/patients/${patientId}/summary` },
  { id: 'datos-urologicos', name: 'Datos Urológicos', href: `/patients/${patientId}/urology` },
  { id: 'informes', name: 'Informes', href: `/patients/${patientId}/reports` },
];

export default function PatientDetailNav({ patientId }: { patientId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = TABS(patientId);
  const current = tabs.find(t => pathname.startsWith(t.href)) || tabs[0];
  const [selectedKey, setSelectedKey] = useState(current.id);

  // Sincronizar con la ruta cuando cambie
  useEffect(() => {
    setSelectedKey(current.id);
  }, [current.id]);

  const handleSelectionChange = (key: React.Key) => {
    const tabId = key as string;
    setSelectedKey(tabId); // Actualizar inmediatamente para la animación
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      // Navegar después de un pequeño delay para permitir que la animación se vea
      setTimeout(() => {
        router.push(tab.href);
      }, 50);
    }
  };

  return (
    <div className="w-full">
      <Tabs
        aria-label="Secciones del paciente"
        items={tabs}
        variant="solid"
        color="default"
        radius="full"
        className="w-full"
        disableAnimation={false}
        motionProps={{
          transition: {
            type: "tween",
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1]
          }
        }}
        classNames={{
          tabList: "w-fit p-0.5 gap-0 rounded-full border border-default-200/20 bg-default-50/10 backdrop-blur-sm relative",
          tab: "px-4 h-9 text-sm font-medium text-foreground-500 data-[hover=true]:text-foreground data-[selected=true]:text-foreground relative z-10",
          tabContent: "transition-colors duration-200",
          cursor: "rounded-full bg-default-200/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        }}
        selectedKey={selectedKey}
        onSelectionChange={handleSelectionChange}
      >
        {(item) => (
          <Tab key={item.id} title={item.name} />
        )}
      </Tabs>
    </div>
  );
}
