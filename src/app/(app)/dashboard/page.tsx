'use client';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  AppointmentsLineChart,
  LabResultsBarChart,
} from '@/components/dashboard/charts';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import { getIpssScoresByPatientId, getPatients, getAppointments } from '@/lib/actions';
import { useEffect, useState } from 'react';
import type { Patient, Appointment, IpssScore } from '@/lib/types';
import { isToday, isYesterday, subMonths } from 'date-fns';
import { RoleBasedContent } from '@/components/shared/role-based-content';
import { AuthDebug } from '@/components/debug/auth-debug';

type DashboardStats = {
    totalPatients: number;
    todayAppointments: number;
    pendingResults: number;
    latestIpssScore: number | 'N/A';
    monthlyPatientsGrowth: number;
    yesterdayAppointments: number;
};

export default function DashboardPage() {
    const { currentUser } = useAuth();
    const { hasPermission, isAdmin, isDoctor, isPatient, isSecretaria, isPromotora } = usePermissions();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!currentUser) return;
            
            let totalPatients = 0;
            let todayAppointments = 0;
            let pendingResults = 0;
            let latestIpssScore: number | 'N/A' = 'N/A';
            let monthlyPatientsGrowth = 0;
            let yesterdayAppointments = 0;

            if (isAdmin() || isSecretaria() || isDoctor()) {
                const [patients, appointments] = await Promise.all([getPatients(), getAppointments()]);
                totalPatients = patients.length;
                todayAppointments = appointments.filter(a => isToday(new Date(a.date))).length;
                yesterdayAppointments = appointments.filter(a => isYesterday(new Date(a.date))).length;
                pendingResults = 0; // Will be calculated from lab results when available
                
                // Calculate monthly growth (patients added this month vs last month)
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                
                const thisMonthPatients = patients.filter(p => {
                    const createdDate = new Date(p.lastVisit || new Date());
                    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
                }).length;
                
                const lastMonthPatients = patients.filter(p => {
                    const createdDate = new Date(p.lastVisit || new Date());
                    return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
                }).length;
                
                monthlyPatientsGrowth = thisMonthPatients - lastMonthPatients;
            }

            if (isPatient() && currentUser.patientId) {
                const ipssScores = await getIpssScoresByPatientId(currentUser.patientId);
                const latestIpss = ipssScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                if (latestIpss) {
                    latestIpssScore = latestIpss.score;
                }
            }
            
            setStats({ totalPatients, todayAppointments, pendingResults, latestIpssScore, monthlyPatientsGrowth, yesterdayAppointments });
        }
        fetchData();
    }, [currentUser]);

    if (!stats) {
        // You can add a skeleton loader here
        return <div>Cargando panel...</div>
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
                value: 0,
                iconName: "Handshake",
                subtext: "Sin afiliaciones registradas",
                trend: "stale"
            }
        ];
    }

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Panel" />
            
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

            {/* Gráficos - Solo para roles que pueden verlos */}
            <RoleBasedContent allowedRoles={['admin', 'doctor', 'secretaria']}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AppointmentsLineChart />
                    <LabResultsBarChart />
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
            <AuthDebug />
        </div>
    );
}
