'use client';
import { getReportsByPatientId } from "@/lib/actions";
import ReportList from "@/components/reports/report-list";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/components/layout/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldBan } from "lucide-react";
import type { Report } from "@/lib/types";

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Restringido</h3>
                <p className="text-muted-foreground">No tienes permiso para ver los informes de este paciente.</p>
            </CardContent>
        </Card>
    )
}

export default function PatientReportsPage({ params }: { params: Promise<{ patientId: string }> }) {
    const { patientId } = use(params);
    const { currentUser, can } = useAuth();
    const [reports, setReports] = useState<Report[] | null>(null);
    const [loading, setLoading] = useState(true);

    const canView = can('patients:write') || currentUser?.patientId === patientId;
    
    useEffect(() => {
        if (canView) {
            getReportsByPatientId(patientId).then(data => {
                setReports(data);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [patientId, canView]);

    if (loading) {
        return <div>Cargando informes...</div>;
    }
    
    if (!canView) {
        return <DeniedAccess />;
    }

    if (!reports) {
        // This should not happen if canView is true and loading is false
        return <div>Error al cargar informes.</div>;
    }

    return <ReportList initialReports={reports} patientId={patientId} />;
}
