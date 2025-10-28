import type { Patient, Consultation, Report as ReportType } from "@/lib/types"
import { Stethoscope } from "lucide-react"
import { ConsultationCard } from "./consultation-card"
import { AddHistoryFab } from "../patients/add-history-fab";
import { ConsultationFormValues } from "../patients/consultation-form";

interface MedicalHistoryTimelineProps {
    userId: string;
    history: Consultation[];
    onNewConsultation: (consultation: Omit<Consultation, 'id' | 'userId'>) => void;
    children?: React.ReactNode;
}

export function MedicalHistoryTimeline({ userId, history, onNewConsultation, children }: MedicalHistoryTimelineProps) {
    // ✅ VALIDACIÓN CRÍTICA - Verificar que userId sea válido
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('❌ MedicalHistoryTimeline - userId inválido:', { 
            userId, 
            type: typeof userId,
            historyLength: history.length
        });
        return (
            <div className="text-center text-destructive p-8">
                <h3 className="text-lg font-semibold">Error de Datos</h3>
                <p className="text-muted-foreground">ID de paciente inválido. No se puede mostrar el historial.</p>
            </div>
        );
    }

    console.log('🔍 MedicalHistoryTimeline - userId recibido:', {
        userId,
        type: typeof userId,
        length: userId.length,
        historyLength: history.length
    });

    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="relative pl-6">
             {children}

            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
            
            <div className="space-y-8 pt-4">
                {sortedHistory.map((item, index) => (
                    <div key={item.id} className="relative">
                        <div className="absolute -left-0.5 top-2.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="pl-8">
                            <ConsultationCard consultation={item} />
                        </div>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <Stethoscope className="mx-auto h-12 w-12" />
                        <h3 className="mt-2 text-lg font-medium">Sin Historial Médico</h3>
                        <p className="mt-1 text-sm">Añade el primer registro de consulta para este paciente.</p>
                    </div>
                )}
            </div>
            <AddHistoryFab userId={userId} onFormSubmit={async (values: ConsultationFormValues) => {
                try {
                    // Convert form values to match the expected consultation type
                    const consultation: Omit<Consultation, 'id' | 'userId'> = {
                        date: values.date instanceof Date ? values.date.toISOString() : values.date,
                        doctor: values.doctor || '',
                        type: values.type || 'Seguimiento',
                        notes: values.notes || '',
                        // Map prescriptions to ensure they have all required fields
                        prescriptions: (values.prescriptions || []).map(p => ({
                            id: p.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
                            medication: p.medication,
                            dosage: p.dosage,
                            duration: p.duration
                        })),
                        // Map reports to ensure they have all required fields
                        reports: (values.reports || []).map(r => ({
                            // Create a new report with all required fields
                            id: `temp-${Math.random().toString(36).substr(2, 9)}`,
                            userId: userId,
                            title: r.title || 'Informe sin título',
                            date: r.date || new Date().toISOString(),
                            type: 'Informe médico',
                            notes: '', // Default empty notes since it's required
                            fileUrl: r.fileUrl || '',
                            attachments: r.attachments || []
                        } as ReportType)),
                        // Map lab results to ensure they have all required fields
                        labResults: (values.labResults || []).map(lr => ({
                            id: lr.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
                            userId: userId,
                            testName: lr.testName,
                            value: lr.value,
                            referenceRange: lr.referenceRange || '',
                            date: lr.date || new Date().toISOString(),
                            estado: 'Pendiente',
                            doctor: values.doctor || ''
                        }))
                    };
                    
                    await onNewConsultation(consultation);
                    return true;
                } catch (error) {
                    console.error('Error submitting consultation:', error);
                    return false;
                }
            }} />
        </div>
    )
}
