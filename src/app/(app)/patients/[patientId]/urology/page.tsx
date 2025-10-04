'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PsaChart } from '@/components/dashboard/charts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table'
import { getLabResultsByPatientId, getIpssScoresByPatientId } from '@/lib/actions';
import LabResultsCard from '@/components/patients/lab-results-card';
import { IpssCalculator } from '@/components/patients/ipss-calculator';
import { use, useEffect, useState } from 'react';
import { useAuth } from '@/components/layout/auth-provider';
import type { LabResult, IpssScore } from '@/lib/types';
import { ShieldBan } from 'lucide-react';

const uroflowData = [
    { date: "2024-08-15", qmax: "12 mL/s", avgFlow: "7 mL/s", voidedVol: "250 mL", pvr: "50 mL" },
    { date: "2024-05-20", qmax: "10 mL/s", avgFlow: "6 mL/s", voidedVol: "220 mL", pvr: "65 mL" },
    { date: "2024-02-10", qmax: "9 mL/s", avgFlow: "5.5 mL/s", voidedVol: "200 mL", pvr: "70 mL" },
];

type UrologyData = {
    labResults: LabResult[];
    ipssScores: IpssScore[];
}

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Restringido</h3>
                <p className="text-muted-foreground">No tienes permiso para ver los datos urológicos de este paciente.</p>
            </CardContent>
        </Card>
    )
}

export default function UrologyDataPage({ params }: { params: Promise<{ patientId: string }> }) {
    const { patientId } = use(params);
    const { currentUser, can } = useAuth();
    const [data, setData] = useState<UrologyData | null>(null);
    const [loading, setLoading] = useState(true);
    
    const canView = can('patients:write') || currentUser?.patientId === patientId;

    useEffect(() => {
        if(canView) {
            Promise.all([
                getLabResultsByPatientId(patientId),
                getIpssScoresByPatientId(patientId)
            ]).then(([labResults, ipssScores]) => {
                setData({ labResults, ipssScores });
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [patientId, canView]);

    if(loading) {
        return <div>Cargando datos...</div>
    }

    if (!canView) {
        return <DeniedAccess />;
    }

    if (!data) {
        return <div>Error al cargar datos urológicos.</div>;
    }

    return (
        <div className="grid gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all bg-card/50">
                    <CardHeader>
                        <CardTitle>Resultados de Uroflujometría</CardTitle>
                        <CardDescription>Datos históricos de uroflujometría del paciente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Qmax</TableHead>
                                <TableHead>Flujo Prom.</TableHead>
                                <TableHead>Vol. Miccional</TableHead>
                                <TableHead>RPM</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uroflowData.map((flow) => (
                                <TableRow key={flow.date}>
                                    <TableCell className="font-medium">{flow.date}</TableCell>
                                    <TableCell>{flow.qmax}</TableCell>
                                    <TableCell>{flow.avgFlow}</TableCell>
                                    <TableCell>{flow.voidedVol}</TableCell>
                                    <TableCell>{flow.pvr}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <LabResultsCard labResults={data.labResults} />
            </div>
            
            <PsaChart />

            <IpssCalculator patientId={patientId} historicalScores={data.ipssScores} />
        </div>
    )
}
