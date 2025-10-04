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
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from "../layout/auth-provider";

const MySwal = withReactContent(Swal);

interface AddAffiliationDialogProps {
    onAddAffiliation: (newAffiliation: Omit<Affiliation, 'id'>) => void;
}

export function AddAffiliationDialog({ onAddAffiliation }: AddAffiliationDialogProps) {
    const [open, setOpen] = useState(false);
    const { currentUser } = useAuth();
    
    const handleSubmit = (values: Omit<Affiliation, 'id' | 'promotora' | 'afiliados'>) => {
        const newAffiliation = {
            ...values,
            promotora: currentUser?.name || 'Usuario', // Use logged in user name
            afiliados: 1, // Default to 1 on creation
        };
        onAddAffiliation(newAffiliation);
        setOpen(false);
        const isDarkMode = document.documentElement.classList.contains('dark');
        MySwal.fire({
            title: 'Afiliación creada',
            text: 'La afiliación fue registrada con éxito',
            icon: 'success',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            confirmButtonColor: '#4f46e5',
        });
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
