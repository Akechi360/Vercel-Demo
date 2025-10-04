// src/components/affiliations/stat-cards.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart, Trophy, Clock } from "lucide-react";
import { useMemo } from "react";

type Affiliation = {
    id: string;
    promotora: string;
    afiliados: number;
    ultimaAfiliacion: string;
    estado: string;
}

interface AffiliationStatCardsProps {
    affiliations: Affiliation[];
}

export function AffiliationStatCards({ affiliations }: AffiliationStatCardsProps) {

    const stats = useMemo(() => {
        const totalPromotoras = affiliations.length;
        
        const totalAfiliaciones = affiliations.reduce((sum, item) => sum + item.afiliados, 0);

        const topPromotora = affiliations.reduce((top, current) => {
            return current.afiliados > top.afiliados ? current : top;
        }, affiliations[0] || { promotora: 'N/A', afiliados: 0 });

        const ultimaAfiliacion = affiliations.reduce((latest, current) => {
            return new Date(current.ultimaAfiliacion) > new Date(latest) ? current.ultimaAfiliacion : latest;
        }, affiliations[0]?.ultimaAfiliacion || 'N/A');

        return {
            totalPromotoras,
            totalAfiliaciones,
            topPromotora,
            ultimaAfiliacion
        };
    }, [affiliations]);


    const cardData = [
        { title: "Total de Promotoras", value: stats.totalPromotoras, icon: Users },
        { title: "Total de Afiliaciones", value: stats.totalAfiliaciones, icon: BarChart },
        { title: "Top Promotora", value: `${stats.topPromotora.promotora} (${stats.topPromotora.afiliados})`, icon: Trophy },
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
