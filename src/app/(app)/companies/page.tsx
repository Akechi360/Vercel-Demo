import { getCompanies, getAffiliations } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import CompanyListWrapper from '@/components/companies/company-list-wrapper';

export default async function CompaniesPage() {
  const initialCompanies = await getCompanies();
  const affiliations = await getAffiliations();

  // Safe array validation to prevent build errors
  const safeCompanies = Array.isArray(initialCompanies) ? initialCompanies : [];
  const safeAffiliations = Array.isArray(affiliations) ? affiliations : [];

  const companiesWithPatientCount = safeCompanies.map(company => {
    // Count active affiliations for this company
    const patientCount = safeAffiliations.filter(affiliation => 
      affiliation.companyId === company.id && 
      affiliation.estado === 'ACTIVA'
    ).length;
    return { ...company, patientCount };
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Empresas" />
      <CompanyListWrapper initialCompanies={companiesWithPatientCount} />
    </div>
  );
}
