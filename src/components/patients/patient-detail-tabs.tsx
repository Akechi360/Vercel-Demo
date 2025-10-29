'use client';

import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import { MedicalHistoryTimeline } from '@/components/history/medical-history-timeline';
import type { Patient, Consultation } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';

type PatientDetailTabsProps = {
  patient: Patient;
  history: Consultation[];
  onNewConsultation: (consultation: Omit<Consultation, 'id' | 'userId'>) => void;
  loading: boolean;
};

const TABS = (patientId: string) => [
  { 
    id: "historial",
    name: 'Historial Médico', 
    href: `/patients/${patientId}`,
    content: (props: Omit<PatientDetailTabsProps, 'patient'>) => (
      <MedicalHistoryTimeline 
        history={props.history} 
        userId={patientId}
        onNewConsultation={props.onNewConsultation}
      />
    )
  },
  { 
    id: "resumen",
    name: 'Resumen', 
    href: `/patients/${patientId}/summary`,
    content: () => (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Resumen del Paciente</h3>
        <p>Contenido del resumen del paciente...</p>
      </div>
    )
  },
  { 
    id: "datos-urologicos",
    name: 'Datos Urológicos', 
    href: `/patients/${patientId}/urology`,
    content: () => (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Datos Urológicos</h3>
        <p>Contenido de datos urológicos...</p>
      </div>
    )
  },
  { 
    id: "informes",
    name: 'Informes', 
    href: `/patients/${patientId}/reports`,
    content: () => (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Informes</h3>
        <p>Contenido de informes...</p>
      </div>
    )
  },
];

export function PatientDetailTabs({
  patient,
  history,
  onNewConsultation,
  loading
}: PatientDetailTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = TABS(patient.id);
  const currentTab = tabs.find(tab => pathname.startsWith(tab.href)) || tabs[0];

  const handleTabChange = (key: React.Key) => {
    const tab = tabs.find(tab => tab.id === key);
    if (tab) {
      router.push(tab.href);
    }
  };

  return (
    <div className="w-full">
      <Tabs 
        aria-label="Secciones del paciente" 
        items={tabs} 
        variant="underlined" 
        color="primary" 
        className="w-full"
        selectedKey={currentTab.id}
        onSelectionChange={handleTabChange}
      >
        {(item) => (
          <Tab 
            key={item.id} 
            title={item.name}
          >
            <Card className="mt-4">
              <CardBody className="p-6">
                {item.content({ history, onNewConsultation, loading })}
              </CardBody>
            </Card>
          </Tab>
        )}
      </Tabs>
    </div>
  );
}
