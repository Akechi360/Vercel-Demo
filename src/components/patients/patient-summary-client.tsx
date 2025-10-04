'use client'

import type { Patient, Appointment, Consultation, IpssScore } from "@/lib/types";
import { QuickActions } from "./quick-actions";
import { IndicatorCard, UpcomingAppointmentsCard } from "./patient-summary-cards";
import { Stethoscope } from "lucide-react";
import { getCompanyById } from "@/lib/actions";
import { useState, useEffect } from "react";

interface PatientSummaryClientProps {
    patient: Patient;
    upcomingAppointments: Appointment[];
    latestConsultations: Consultation[];
    latestIpss: IpssScore | null;
}

export default function PatientSummaryClient({
    patient,
    upcomingAppointments,
    latestConsultations,
    latestIpss
}: PatientSummaryClientProps) {

    const [companyName, setCompanyName] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (patient.companyId) {
            getCompanyById(patient.companyId).then(company => {
                setCompanyName(company?.name);
            });
        }
    }, [patient.companyId]);

    // This would eventually come from lab results
    const latestPsa = { value: "4.1", date: "2024-05-01" };

    const patientWithCompany = { ...patient, companyName };

    return (
        <div className="space-y-8">
            <QuickActions 
                patient={patientWithCompany}
                upcomingAppointments={upcomingAppointments}
                latestConsultations={latestConsultations}
                latestIpss={latestIpss}
                latestPsa={latestPsa}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <IndicatorCard 
                    title="Último PSA"
                    value={`${latestPsa.value} ng/mL`}
                    subtext={`del ${new Date(latestPsa.date).toLocaleDateString()}`}
                    icon="Droplets"
                />
                <IndicatorCard 
                    title="Último IPSS"
                    value={latestIpss ? latestIpss.score.toString() : 'N/A'}
                    subtext={latestIpss ? `(${latestIpss.category})` : "Sin registro"}
                    icon="Calculator"
                />
                <IndicatorCard 
                    title="Próxima Cita"
                    value={upcomingAppointments.length > 0 ? new Date(upcomingAppointments[0].date).toLocaleDateString() : "Ninguna"}
                    subtext={upcomingAppointments.length > 0 ? new Date(upcomingAppointments[0].date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : " "}
                    icon="Calendar"
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <UpcomingAppointmentsCard appointments={upcomingAppointments} />
                {/* Here could be another section, e.g., "Recent Lab Results" */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Consultas Recientes</h3>
                    {latestConsultations.length > 0 ? (
                         <div className="space-y-4">
                            {latestConsultations.map(consult => (
                                <div key={consult.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                                        <Stethoscope className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{consult.type}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(consult.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No hay consultas recientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
