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

const MySwal = withReactContent(Swal);

interface AddAffiliationDialogProps {
    onAddAffiliation: (newAffiliation: Omit<Affiliation, 'id'>) => void;
    onRefresh?: () => void;
}

export function AddAffiliationDialog({ onAddAffiliation, onRefresh }: AddAffiliationDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { currentUser } = useAuth();
    const { toast } = useToast();
    
    const handleSubmit = async (values: Omit<FormValues, 'nombreCompleto' | 'telefono' | 'direccion'>) => {
        setIsLoading(true);
        try {
            // For now, we'll just show a success message and refresh the page
            // The actual affiliation creation should be done through the patient creation flow
            // or through a proper form that selects company and user
            
            setOpen(false);
            
            // Refresh the page to show any existing affiliations
            if (onRefresh) {
                onRefresh();
            }
            
            const isDarkMode = document.documentElement.classList.contains('dark');
            MySwal.fire({
                title: 'Información',
                text: 'Para crear afiliaciones, por favor usa el flujo de "Agregar Paciente" y selecciona una empresa. Las afiliaciones se crean automáticamente cuando un paciente se asocia a una empresa.',
                icon: 'info',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                confirmButtonColor: '#4f46e5',
            });
        } catch (error) {
            console.error('Error:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Hubo un problema. Inténtalo de nuevo.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Afiliación
                </Button>
            </DialogTrigger>
            <DialogContent>
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
