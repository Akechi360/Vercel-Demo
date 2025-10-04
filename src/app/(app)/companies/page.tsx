import { getCompanies, getPatients } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import CompanyListWrapper from '@/components/companies/company-list-wrapper';

export default async function CompaniesPage() {
  const initialCompanies = await getCompanies();
  const patients = await getPatients();

  const companiesWithPatientCount = initialCompanies.map(company => {
    const patientCount = patients.filter(p => p.companyId === company.id).length;
    return { ...company, patientCount };
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Empresas" />
      <CompanyListWrapper initialCompanies={companiesWithPatientCount} />
    </div>
  );
}
