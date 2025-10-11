'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Payment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DollarSign, FileWarning, Wallet, FileText } from "lucide-react";
import { useMemo } from "react";
import { isThisMonth } from 'date-fns';

interface FinanceStatCardsProps {
    payments: Payment[];
}

export function FinanceStatCards({ payments }: FinanceStatCardsProps) {

    const stats = useMemo(() => {
        const totalPending = payments
            .filter(p => p.status === 'Pendiente')
            .reduce((sum, p) => sum + p.monto, 0);
        
        const totalPaidThisMonth = payments
            .filter(p => p.status === 'Pagado' && isThisMonth(new Date(p.date)))
            .reduce((sum, p) => sum + p.monto, 0);

        const overdueInvoices = payments
            .filter(p => p.status === 'Pendiente' && new Date(p.date) < new Date()).length;

        const totalInvoices = payments.length;

        return { totalPending, totalPaidThisMonth, overdueInvoices, totalInvoices };
    }, [payments]);


    const cardData = [
        { title: "Total Pendiente", value: `$${stats.totalPending.toFixed(2)}`, icon: Wallet },
        { title: "Pagado (este mes)", value: `$${stats.totalPaidThisMonth.toFixed(2)}`, icon: DollarSign },
        { title: "Facturas Vencidas", value: stats.overdueInvoices, icon: FileWarning },
        { title: "Comprobantes Emitidos", value: stats.totalInvoices, icon: FileText },
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
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
