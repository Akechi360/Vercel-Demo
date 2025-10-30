'use client';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  AppointmentsLineChart,
  LabResultsBarChart,
} from '@/components/dashboard/charts';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { getIpssScoresByUserId, getPatients, getAppointments, getAffiliations, getLabResultsStats } from '@/lib/actions';
import { useEffect, useState, useRef } from 'react';
import type { Patient, Appointment, IpssScore } from '@/lib/types';
import { isToday, isYesterday, subMonths } from 'date-fns';
import { RoleBasedContent } from '@/components/shared/role-based-content';
import { HeartbeatLoader } from '@/components/ui/heartbeat-loader';
import { FadeInSection } from '@/components/animations/fade-in-section';
import { motion } from 'framer-motion';

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
            const userIsAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'admin';
            const userIsDoctor = currentUser.role === 'DOCTOR' || currentUser.role === 'doctor';
            const userIsPatient = currentUser.role === 'PATIENT' || currentUser.role === 'patient';
            const userIsSecretaria = currentUser.role === 'SECRETARIA' || currentUser.role === 'secretaria';
            const userIsPromotora = currentUser.role === 'PROMOTORA' || currentUser.role === 'promotora';
            
            let totalPatients = 0;
            let todayAppointments = 0;
            let pendingResults = 0;
            let latestIpssScore: number | 'N/A' = 'N/A';
            let monthlyPatientsGrowth = 0;
            let yesterdayAppointments = 0;
            let activeAffiliations = 0;

            if (userIsAdmin || userIsSecretaria || userIsDoctor) {
                const [patients, appointments, labStats] = await Promise.all([
                    getPatients(), 
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

            if (userIsPatient && currentUser.userId) {
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

    if (!stats) {
        return <HeartbeatLoader text="Cargando estadísticas..." size="md" />;
    }

    const patientStatCards = [
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
    ];

    const adminDoctorStatCards = [
        {
            title: "Total Pacientes",
            value: stats.totalPatients,
            iconName: "Users",
            subtext: stats.monthlyPatientsGrowth > 0 ? `+${stats.monthlyPatientsGrowth} este mes` : 
                    stats.monthlyPatientsGrowth < 0 ? `${stats.monthlyPatientsGrowth} este mes` : "Sin cambios este mes",
            trend: stats.monthlyPatientsGrowth > 0 ? "up" : stats.monthlyPatientsGrowth < 0 ? "down" : "stale"
        },
        {
            title: "Citas de Hoy",
            value: stats.todayAppointments,
            iconName: "CalendarDays",
            subtext: stats.todayAppointments > stats.yesterdayAppointments ? 
                    `+${stats.todayAppointments - stats.yesterdayAppointments} vs ayer` :
                    stats.todayAppointments < stats.yesterdayAppointments ?
                    `${stats.todayAppointments - stats.yesterdayAppointments} vs ayer` :
                    "Igual que ayer",
            trend: stats.todayAppointments > stats.yesterdayAppointments ? "up" : 
                   stats.todayAppointments < stats.yesterdayAppointments ? "down" : "stale"
        },
        {
            title: "Resultados Pendientes",
            value: stats.pendingResults,
            iconName: "FlaskConical",
            subtext: stats.pendingResults > 0 ? "Análisis requerido" : "Sin resultados pendientes",
            trend: "stale"
        }
    ];

    // Determinar qué tarjetas mostrar según el rol
    let statCards: typeof patientStatCards = [];
    if (isPatient()) {
        statCards = patientStatCards;
    } else if (isAdmin() || isDoctor() || isSecretaria()) {
        statCards = adminDoctorStatCards;
    } else if (isPromotora()) {
        statCards = [
            {
                title: "Afiliaciones Activas",
                value: stats.activeAffiliations,
                iconName: "Handshake",
                subtext: stats.activeAffiliations > 0 ? 
                    `${stats.activeAffiliations} afiliación${stats.activeAffiliations > 1 ? 'es' : ''} activa${stats.activeAffiliations > 1 ? 's' : ''}` : 
                    "Sin afiliaciones registradas",
                trend: stats.activeAffiliations > 0 ? "up" : "stale"
            }
        ];
    }

    return (
        <div className="flex flex-col gap-8">
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
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/4 via-transparent to-accent/4 rounded-3xl blur-3xl -z-10" />
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
                {statCards.map((card, index) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        iconName={card.iconName as any}
                        subtext={card.subtext}
                        trend={card.trend as "up" | "down" | "stale"}
                        index={index}
                    />
                ))}
                </div>
            </div>

            {/* Gráficos - Solo para roles que pueden verlos */}
            <RoleBasedContent allowedRoles={['admin', 'doctor', 'secretaria']}>
                <div className="grid gap-4 md:grid-cols-2">
                    <FadeInSection delay={0.5}>
                        <AppointmentsLineChart />
                    </FadeInSection>
                    <FadeInSection delay={0.6}>
                        <LabResultsBarChart />
                    </FadeInSection>
                </div>
            </RoleBasedContent>

            {/* Contenido específico para promotoras */}
            <RoleBasedContent allowedRoles={['promotora']}>
                <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Panel de Promotora</h3>
                    <p className="text-blue-700">Aquí podrás ver tus afiliaciones y estadísticas de ventas.</p>
                </div>
            </RoleBasedContent>

            {/* Contenido específico para pacientes */}
            <RoleBasedContent allowedRoles={['patient']}>
                <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">Tu Información Médica</h3>
                    <p className="text-green-700">Aquí puedes ver tu historial médico y próximas citas.</p>
                </div>
            </RoleBasedContent>
        </div>
    );
}
