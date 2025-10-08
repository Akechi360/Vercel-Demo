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
import { useToast } from "@/hooks/use-toast";
import { useAffiliationStore } from "@/stores/affiliation-store";

const MySwal = withReactContent(Swal);

interface AddAffiliationDialogProps {
    onAddAffiliation?: (newAffiliation: Omit<Affiliation, 'id'>) => void;
    onRefresh?: () => void;
}

export function AddAffiliationDialog({ onAddAffiliation, onRefresh }: AddAffiliationDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { currentUser } = useAuth();
    const { toast } = useToast();
    const { clearCache } = useAffiliationStore();
    
    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            console.log('🔍 Creating affiliation with values:', values);
            
            const affiliationData = {
                companyId: values.companyId === "none" ? undefined : values.companyId, // Convert "none" to undefined
                userId: currentUser?.id || "", // Use logged in user automatically
                planId: values.planId,
                tipoPago: values.tipoPago,
                monto: values.monto,
                estado: values.estado,
            };

            const newAffiliation = await addAffiliation(affiliationData);
            
            setOpen(false);
            
            // Add the new affiliation to local state immediately
            if (onAddAffiliation) {
                onAddAffiliation(newAffiliation);
            }
            
            // Show success message first
            const isDarkMode = document.documentElement.classList.contains('dark');
            MySwal.fire({
                title: 'Afiliación creada',
                text: 'La afiliación fue registrada con éxito en la base de datos.',
                icon: 'success',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                confirmButtonColor: '#4f46e5',
            }).then(() => {
                // Refresh page data after user acknowledges success
                if (onRefresh) {
                    onRefresh();
                }
            });
        } catch (error) {
            console.error('Error creating affiliation:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo crear la afiliación.",
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
