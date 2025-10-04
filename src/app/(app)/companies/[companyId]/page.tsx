import { getCompanyById, getPatientsByCompanyId } from "@/lib/actions";
import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Mail, Phone } from "lucide-react";
import PatientList from "@/components/patients/patient-list";
import { PatientListWrapper } from "@/components/patients/patient-list-wrapper";

export default async function CompanyDetailPage({ params }: { params: { companyId: string } }) {
    const company = await getCompanyById(params.companyId);
    if (!company) {
        notFound();
    }

    const patients = await getPatientsByCompanyId(params.companyId);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title={company.name} backHref="/companies" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Building className="h-6 w-6 text-primary" />
                        Información de la Empresa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>RUC/NIT:</strong> {company.ruc}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {company.phone || 'No disponible'}</p>
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {company.email || 'No disponible'}</p>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Pacientes Afiliados ({patients.length})</h2>
                {patients.length > 0 ? (
                    <PatientListWrapper initialPatients={patients} />
                ) : (
                    <p className="text-muted-foreground">No hay pacientes afiliados a esta empresa.</p>
                )}
            </div>
        </div>
    );
}
