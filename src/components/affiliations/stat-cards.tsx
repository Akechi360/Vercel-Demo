// src/components/affiliations/stat-cards.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart, Trophy, Clock } from "lucide-react";
import { useMemo } from "react";

type Affiliation = {
    id: string;
    planId: string;
    estado: string;
    fechaInicio: string;
    fechaFin?: string | null;
    monto: number;
    beneficiarios?: any;
    companyId?: string | null;
    userId: string;
    company?: {
        id: string;
        nombre: string;
        rif: string;
        direccion: string;
        telefono: string;
        email: string;
        contacto: string;
        createdAt: string;
        updatedAt: string;
    } | null;
    user?: {
        id: string;
        email: string;
        name: string;
        password: string;
        role: string;
        status: string;
        createdAt: string;
        phone: string;
        lastLogin?: string | null;
        patientId?: string | null;
        avatarUrl?: string | null;
    } | null;
}

interface AffiliationStatCardsProps {
    affiliations: Affiliation[];
}

export function AffiliationStatCards({ affiliations }: AffiliationStatCardsProps) {

    const stats = useMemo(() => {
        const totalAfiliaciones = affiliations.length;
        
        const totalMonto = affiliations.reduce((sum, item) => sum + item.monto, 0);

        const afiliacionesActivas = affiliations.filter(item => item.estado === 'ACTIVA').length;

        const ultimaAfiliacion = affiliations.reduce((latest, current) => {
            return new Date(current.fechaInicio) > new Date(latest) ? current.fechaInicio : latest;
        }, affiliations[0]?.fechaInicio || new Date().toISOString());

        return {
            totalAfiliaciones,
            totalMonto,
            afiliacionesActivas,
            ultimaAfiliacion
        };
    }, [affiliations]);


    const cardData = [
        { title: "Total de Afiliaciones", value: stats.totalAfiliaciones, icon: Users },
        { title: "Monto Total", value: `$${stats.totalMonto.toFixed(2)}`, icon: BarChart },
        { title: "Afiliaciones Activas", value: stats.afiliacionesActivas, icon: Trophy },
        { title: "Última Afiliación", value: new Date(stats.ultimaAfiliacion).toLocaleDateString(), icon: Clock },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cardData.map((card, index) => (
                <Card key={index} className="rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <card.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
