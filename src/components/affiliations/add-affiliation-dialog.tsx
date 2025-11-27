// src/components/affiliations/add-affiliation-dialog.tsx
'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddAffiliationForm } from "./add-affiliation-form";
import type { Affiliation } from "@/lib/types";
import type { FormValues } from "./add-affiliation-form";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from "../layout/auth-provider";
import { addAffiliation } from "@/lib/actions";
import { useAffiliations } from "@/lib/store/global-store";

const MySwal = withReactContent(Swal);

interface AddAffiliationDialogProps {
    onAddAffiliation?: (newAffiliation: Omit<Affiliation, 'id'>) => void;
    onRefresh?: () => void;
}

export function AddAffiliationDialog({ onAddAffiliation, onRefresh }: AddAffiliationDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { currentUser } = useAuth();
    const { refresh } = useAffiliations();

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            console.log('🔍 Creating affiliation with values:', values);

            // Determine which users to affiliate
            const userIds = values.selectedUserIds && values.selectedUserIds.length > 0
                ? values.selectedUserIds
                : [(values.userId || currentUser?.id || "")];

            console.log('👥 Creating affiliations for users:', userIds);

            // Create affiliations for all selected users
            const results = await Promise.all(
                userIds.map(userId => {
                    const affiliationData = {
                        companyId: values.companyId === "none" ? undefined : values.companyId,
                        userId: userId,
                        planId: values.planId,
                        tipoPago: values.tipoPago,
                        monto: values.monto,
                        estado: values.estado,
                    };
                    return addAffiliation(affiliationData);
                })
            );

            // Check if any failed
            const failedCount = results.filter(r => !r.success).length;
            const successCount = results.filter(r => r.success).length;

            if (successCount > 0) {
                setOpen(false);

                // Add the new affiliations to local state
                if (onAddAffiliation) {
                    results.forEach(result => {
                        if (result.success && result.data) {
                            onAddAffiliation(result.data);
                        }
                    });
                }

                // Show success message
                const isDarkMode = document.documentElement.classList.contains('dark');
                const message = failedCount > 0
                    ? `${successCount} afiliación(es) creada(s) exitosamente. ${failedCount} fallaron.`
                    : userIds.length > 1
                        ? `${successCount} afiliaciones creadas exitosamente.`
                        : 'La afiliación fue registrada con éxito.';

                MySwal.fire({
                    title: failedCount > 0 ? 'Parcialmente exitoso' : 'Afiliación(es) creada(s)',
                    text: message,
                    icon: failedCount > 0 ? 'warning' : 'success',
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    confirmButtonColor: '#4f46e5',
                }).then(() => {
                    // Refresh page data after user acknowledges success
                    if (onRefresh) {
                        onRefresh();
                    }
                });
            } else {
                // Handle error from server - all affiliations failed
                const isDarkMode = document.documentElement.classList.contains('dark');
                const firstError = results.find(r => !r.success);
                const errorMessage = firstError?.error || 'No se pudo crear la(s) afiliación(es).';

                // Determine error type and icon
                let errorTitle = "Error";
                let errorIcon: 'error' | 'warning' | 'info' = 'error';

                if (errorMessage.includes('usuario no existe') || errorMessage.includes('Usuario con ID')) {
                    errorTitle = "Usuario no encontrado";
                    errorIcon = 'warning';
                } else if (errorMessage.includes('clave foránea') || errorMessage.includes('Foreign key constraint')) {
                    errorTitle = "Error de referencia";
                    errorIcon = 'warning';
                } else if (errorMessage.includes('conexión') || errorMessage.includes('base de datos')) {
                    errorTitle = "Error de conexión";
                    errorIcon = 'error';
                } else if (errorMessage.includes('empresa') || errorMessage.includes('company')) {
                    errorTitle = "Error de empresa";
                    errorIcon = 'warning';
                }

                MySwal.fire({
                    title: errorTitle,
                    text: errorMessage,
                    icon: errorIcon,
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    confirmButtonColor: errorIcon === 'error' ? '#dc2626' : '#f59e0b',
                    confirmButtonText: 'Entendido'
                });
            }
        } catch (error) {
            console.error('Error creating affiliation:', error);

            // Fallback error handling for unexpected errors
            const isDarkMode = document.documentElement.classList.contains('dark');
            let errorMessage = 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';

            // Try to extract a more specific error message
            if (error instanceof Error) {
                const errorMsg = error.message.toLowerCase();
                if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
                } else if (errorMsg.includes('timeout')) {
                    errorMessage = 'La operación tardó demasiado. Intenta nuevamente.';
                } else if (errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
                    errorMessage = 'No tienes permisos para realizar esta acción.';
                }
            }

            MySwal.fire({
                title: 'Error inesperado',
                text: errorMessage,
                icon: 'error',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                confirmButtonColor: '#dc2626',
                confirmButtonText: 'Entendido'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        // No need to refresh cache when closing - keep it for next time
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Afiliación
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Nueva Afiliación</DialogTitle>
                    <DialogDescription>
                        Completa los datos para crear una nueva afiliación.
                    </DialogDescription>
                </DialogHeader>
                <AddAffiliationForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
