
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Calendar, Droplets, Calculator, type LucideIcon, type LucideProps, Stethoscope } from "lucide-react";
import { ElementType } from "react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const icons: { [key: string]: ElementType } = {
    Droplets,
    Calculator,
    Calendar,
    Stethoscope
};

interface IndicatorCardProps {
    title: string;
    value: string;
    subtext?: string;
    icon: keyof typeof icons;
}

export function IndicatorCard({ title, value, subtext, icon }: IndicatorCardProps) {
    const Icon = icons[icon];
    return (
        <Card className={cn("rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50 hover:scale-[1.02]", "hover:shadow-[0_0_20px_rgba(46,49,146,0.4)]")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </CardContent>
        </Card>
    );
}

interface UpcomingAppointmentsCardProps {
    appointments: Appointment[];
}

export function UpcomingAppointmentsCard({ appointments }: UpcomingAppointmentsCardProps) {
    return (
        <Card className="rounded-2xl shadow-sm transition-all duration-300 ease-in-out bg-card/50">
            <CardHeader>
                <CardTitle>Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="bg-primary/10 text-primary p-3 rounded-full">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{appointment.reason}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {format(new Date(appointment.date), "eeee, d 'de' MMMM", { locale: es })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{format(new Date(appointment.date), 'p', { locale: es })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No hay próximas citas programadas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
