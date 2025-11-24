'use client';
import { getPatientById, getAppointments, getConsultationsByUserId, getIpssScoresByUserId, getLatestPsaByUserId } from '@/lib/actions';
import { HeartbeatLoader } from '@/components/ui/heartbeat-loader';
import { use, useEffect, useState } from 'react';
import PatientSummaryClient from '@/components/patients/patient-summary-client';
import type { Patient, Appointment, Consultation, IpssScore } from '@/lib/types';
import { useAuth } from '@/components/layout/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldBan } from 'lucide-react';

type SummaryData = {
    patient: Patient;
    upcomingAppointments: Appointment[];
    latestConsultations: Consultation[];
    latestIpss: IpssScore | null;
    latestPsa: { value: string; date: string; unit?: string } | null;
};

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Restringido</h3>
                <p className="text-muted-foreground">No tienes permiso para ver el resumen de este paciente.</p>
            </CardContent>
        </Card>
    )
}

export default function PatientSummaryPage({ params }: { params: Promise<{ patientId: string }> }) {
    const { patientId } = use(params);
    const { currentUser, can } = useAuth();
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    const canView = can('patients:read') || currentUser?.userId === patientId;

    useEffect(() => {
        if (canView) {
            Promise.all([
                getPatientById(patientId),
                getAppointments(),
                getConsultationsByUserId(patientId),
                getIpssScoresByUserId(patientId),
                getLatestPsaByUserId(patientId),
            ]).then(([patient, appointments, consultations, ipssScores, psaResult]) => {
                if (patient) {
                    const upcomingAppointments = appointments.filter(a => new Date(a.date) > new Date() && a.userId === patientId);
                    const latestConsultations = consultations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
                    const latestIpss = ipssScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

                    setSummaryData({
                        patient,
                        upcomingAppointments,
                        latestConsultations,
                        latestIpss,
                        latestPsa: psaResult,
                    });
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [patientId, canView]);

    if (loading) {
        return <HeartbeatLoader text="Cargando resumen..." size="md" />;
    }

    if (!canView) {
        return <DeniedAccess />;
    }

    if (!summaryData?.patient) {
        return <div>Paciente no encontrado.</div>;
    }

    return (
        <PatientSummaryClient
            patient={summaryData.patient}
            upcomingAppointments={summaryData.upcomingAppointments}
            latestConsultations={summaryData.latestConsultations}
            latestIpss={summaryData.latestIpss}
            latestPsa={summaryData.latestPsa}
        />
    );
}
