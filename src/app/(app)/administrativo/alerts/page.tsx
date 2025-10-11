'use client';
import React from 'react';
import { getSupplies } from "@/lib/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CalendarX2, Package, ShieldBan } from "lucide-react";
import { differenceInDays, isBefore } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/layout/auth-provider";

const LOW_STOCK_THRESHOLD = 20;
const EXPIRY_THRESHOLD_DAYS = 30;

function DeniedAccess() {
    return (
        <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <ShieldBan className="h-12 w-12 text-destructive" />
                <h3 className="text-xl font-semibold">Acceso Denegado</h3>
                <p className="text-muted-foreground">No tienes permiso para ver esta sección.</p>
            </CardContent>
        </Card>
    )
}


export default function AlertsPage() {
    const { can } = useAuth();
    const [supplies, setSupplies] = React.useState<Awaited<ReturnType<typeof getSupplies>>>([]);

    React.useEffect(() => {
        if (can('admin:all')) {
            getSupplies().then(setSupplies);
        }
    }, [can]);

    if (!can('admin:all')) {
        return <DeniedAccess />;
    }

    const lowStockAlerts = supplies.filter(s => s.stock < LOW_STOCK_THRESHOLD);

    const expiringSoonAlerts = supplies.filter(s => {
        const expiryDate = new Date(s.expiryDate);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        return isBefore(expiryDate, today) || (daysUntilExpiry > 0 && daysUntilExpiry <= EXPIRY_THRESHOLD_DAYS);
    });

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Alertas de Stock" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            Stock Bajo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lowStockAlerts.length > 0 ? lowStockAlerts.map(supply => (
                            <div key={supply.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{supply.name}</p>
                                        <p className="text-sm text-muted-foreground">{supply.category}</p>
                                    </div>
                                </div>
                                <Badge variant="destructive">{supply.stock} {supply.unit}</Badge>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-center py-8">No hay alertas de stock bajo.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <CalendarX2 className="h-6 w-6 text-red-500" />
                            Próximos a Vencer / Vencidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {expiringSoonAlerts.length > 0 ? expiringSoonAlerts.map(supply => {
                            const expiryDate = new Date(supply.expiryDate);
                            const today = new Date();
                            const isExpired = isBefore(expiryDate, today);
                            const daysUntilExpiry = differenceInDays(expiryDate, today);

                            return (
                                <div key={supply.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">{supply.name}</p>
                                            <p className="text-sm text-muted-foreground">{new Date(supply.expiryDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                     <Badge variant={isExpired ? 'destructive' : 'outline'}>
                                        {isExpired ? 'Vencido' : `Vence en ${daysUntilExpiry} días`}
                                    </Badge>
                                </div>
                            )
                        }) : (
                            <p className="text-muted-foreground text-center py-8">No hay productos próximos a vencer.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}