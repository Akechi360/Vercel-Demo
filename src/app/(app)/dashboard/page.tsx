'use client';
import { StatCard } from '@/components/dashboard/stat-card';
import {
    AppointmentsLineChart,
    LabResultsBarChart,
} from '@/components/dashboard/charts';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { getIpssScoresByUserId, getAppointments, getAffiliations, getLabResultsStats } from '@/lib/actions';
import { getCachedPatients } from '@/lib/cachedActions';
import { useEffect, useState, useRef } from 'react';
import type { Patient, Appointment, IpssScore } from '@/lib/types';
import { isToday, isYesterday, subMonths } from 'date-fns';
import { RoleBasedContent } from '@/components/shared/role-based-content';
import { HeartbeatLoader } from '@/components/ui/heartbeat-loader';
import { FadeInSection } from '@/components/animations/fade-in-section';
import { motion } from 'framer-motion';

function SkeletonStatCard() {
    return (
        <div className="bg-card/80 rounded-xl shadow-lg border-l-4 border-l-primary/20 p-6 animate-pulse h-[140px]">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-8 w-16 bg-muted rounded" />
                </div>
                <div className="h-10 w-10 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-32 bg-muted rounded" />
        </div>
    );
}

type DashboardStats = {
    totalPatients: number;
    todayAppointments: number;
    pendingResults: number;
    latestIpssScore: number | 'N/A';
    monthlyPatientsGrowth: number;
    yesterdayAppointments: number;
    activeAffiliations: number;
};

export default function DashboardPage() {
    const { currentUser } = useAuth();
    const { hasPermission, isAdmin, isDoctor, isPatient, isSecretaria, isPromotora } = usePermissions();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const isFetchingRef = useRef(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // ⚡ Evitar múltiples ejecuciones simultáneas
        if (!currentUser || isFetchingRef.current || hasFetchedRef.current) return;

        isFetchingRef.current = true;

        async function fetchData() {
            if (!currentUser) return; // ✅ Validación adicional para TypeScript

            // ✅ Calcular roles una sola vez dentro de la función (evita dependencias inestables)
            const userIsAdmin = currentUser.role === 'ADMIN';
            const userIsDoctor = currentUser.role === 'DOCTOR';
            const userIsUser = currentUser.role === 'USER';
            const userIsSecretaria = currentUser.role === 'SECRETARIA';
            const userIsPromotora = currentUser.role === 'PROMOTORA';

            let totalPatients = 0;
            let todayAppointments = 0;
            let pendingResults = 0;
            let latestIpssScore: number | 'N/A' = 'N/A';
            let monthlyPatientsGrowth = 0;
            let yesterdayAppointments = 0;
            let activeAffiliations = 0;

            if (userIsAdmin || userIsSecretaria || userIsDoctor) {
                const [patients, appointments, labStats] = await Promise.all([
                    getCachedPatients(currentUser.userId), // Use cached version
                    getAppointments(),
                    getLabResultsStats()
                ]);

                // Safe array validation to prevent build errors
                const safePatients = Array.isArray(patients) ? patients : [];
                const safeAppointments = Array.isArray(appointments) ? appointments : [];

                totalPatients = safePatients.length;
                todayAppointments = safeAppointments.filter(a => isToday(new Date(a.date))).length;
                yesterdayAppointments = safeAppointments.filter(a => isYesterday(new Date(a.date))).length;
                pendingResults = labStats.pending;

                // Calculate monthly growth (patients added this month vs last month)
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                const thisMonthPatients = safePatients.filter(p => {
                    const createdDate = new Date(p.lastVisit || new Date());
                    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
                }).length;

                const lastMonthPatients = safePatients.filter(p => {
                    const createdDate = new Date(p.lastVisit || new Date());
                    return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
                }).length;

                monthlyPatientsGrowth = thisMonthPatients - lastMonthPatients;
            }

            if (userIsUser && currentUser.userId) {
                const ipssScores = await getIpssScoresByUserId(currentUser.userId);
                const latestIpss = ipssScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                if (latestIpss) {
                    latestIpssScore = latestIpss.score;
                }
            }

            if (userIsPromotora) {
                const affiliations = await getAffiliations();
                const safeAffiliations = Array.isArray(affiliations) ? affiliations : [];
                activeAffiliations = safeAffiliations.filter(aff =>
                    aff.estado === 'ACTIVA' || aff.estado === 'INICIAL' || aff.estado === 'ABONO'
                ).length;
            }

            setStats({ totalPatients, todayAppointments, pendingResults, latestIpssScore, monthlyPatientsGrowth, yesterdayAppointments, activeAffiliations });
            hasFetchedRef.current = true;
        }

        fetchData().finally(() => {
            isFetchingRef.current = false;
        });
    }, [currentUser?.userId, currentUser?.role]); // ✅ Solo dependencias estables

    const isLoading = !stats;

    const patientStatCards = stats ? [
        {
            title: "Próxima Cita",
            value: 0,
            iconName: "CalendarDays",
            subtext: "No hay citas programadas",
            trend: "stale"
        },
        {
            title: "Último Puntaje IPSS",
            value: stats.latestIpssScore,
            iconName: "Activity",
            subtext: stats.latestIpssScore !== 'N/A' ? (stats.latestIpssScore <= 7 ? 'Síntomas Leves' : stats.latestIpssScore <= 19 ? 'Síntomas Moderados' : 'Síntomas Severos') : 'Sin registro',
            trend: "stale"
        },
        {
            title: "Resultados Pendientes",
            value: 0,
            iconName: "FlaskConical",
            subtext: "No hay resultados pendientes",
            trend: "stale"
        }
    ] : [];

    const adminDoctorStatCards = stats ? [
        {
            title: "Total Pacientes",
            value: stats.totalPatients,
            iconName: "Users",
            subtext: `${stats.monthlyPatientsGrowth >= 0 ? '+' : ''}${stats.monthlyPatientsGrowth} este mes`,
            trend: stats.monthlyPatientsGrowth >= 0 ? "up" : "down"
        },
        {
            title: "Citas Hoy",
            value: stats.todayAppointments,
            iconName: "Calendar",
            subtext: `${stats.yesterdayAppointments} ayer`,
            trend: stats.todayAppointments >= stats.yesterdayAppointments ? "up" : "down"
        },
        {
            title: "Resultados Pendientes",
            value: stats.pendingResults,
            iconName: "FileText",
            subtext: "Requieren revisión",
            trend: "stale"
        }
    ] : [];

    const promotoraStatCards = stats ? [
        {
            title: "Afiliaciones Activas",
            value: stats.activeAffiliations,
            iconName: "Users",
            subtext: "Total acumulado",
            trend: "up"
        },
        {
            title: "Comisiones Mes",
            value: 0,
            iconName: "DollarSign",
            subtext: "En proceso",
            trend: "stale"
        },
        {
            title: "Nuevos Prospectos",
            value: 0,
            iconName: "UserPlus",
            subtext: "Esta semana",
            trend: "stale"
        }
    ] : [];

    const statCards = isPromotora() ? promotoraStatCards : (isPatient() ? patientStatCards : adminDoctorStatCards);

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background/10 to-primary/5 p-6">
            <div className="flex flex-col gap-8 max-w-7xl mx-auto">
                <div className="relative mb-8">
                    {/* Línea decorativa animada con gradiente */}
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 96, opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                        className="absolute -top-3 left-0 h-0.5 bg-gradient-to-r from-primary via-accent/80 to-transparent rounded-full"
                    />

                    <PageHeader title="Panel de Control" />
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="relative mb-8">
                    {/* Glow ambiental imperceptible */}


                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
                        {isLoading ? (
                            <>
                                <SkeletonStatCard />
                                <SkeletonStatCard />
                                <SkeletonStatCard />
                            </>
                        ) : (
                            statCards.map((card, index) => (
                                <StatCard
                                    key={card.title}
                                    title={card.title}
                                    value={card.value}
                                    iconName={card.iconName as any}
                                    subtext={card.subtext}
                                    trend={card.trend as "up" | "down" | "stale"}
                                    index={index}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Gráficos - Solo para roles que pueden verlos */}
                <RoleBasedContent allowedRoles={['ADMIN', 'DOCTOR', 'SECRETARIA']}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <FadeInSection delay={0.5}>
                            <div className="bg-card/80 rounded-3xl shadow-lg border-l-4 border-l-primary p-4">
                                <h3 className="text-sm font-medium text-foreground mb-2">Citas</h3>
                                <AppointmentsLineChart />
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.6}>
                            <div className="bg-card/80 rounded-3xl shadow-lg border-l-4 border-l-primary p-4">
                                <h3 className="text-sm font-medium text-foreground mb-2">Resultados de Laboratorio</h3>
                                <LabResultsBarChart />
                            </div>
                        </FadeInSection>
                    </div>
                </RoleBasedContent>

                {/* Contenido específico para promotoras */}
                <RoleBasedContent allowedRoles={['PROMOTORA']}>
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Panel de Promotora</h3>
                        <p className="text-blue-700">Aquí podrás ver tus afiliaciones y estadísticas de ventas.</p>
                    </div>
                </RoleBasedContent>

                {/* Contenido específico para pacientes */}
                <RoleBasedContent allowedRoles={['USER']}>
                    <div className="bg-green-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Tu Información Médica</h3>
                        <p className="text-green-700">Aquí puedes ver tu historial médico y próximas citas.</p>
                    </div>
                </RoleBasedContent>
            </div>
        </div>
    );
}
