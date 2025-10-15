import { getCompanies } from '@/lib/actions';
import { PageHeader } from '@/components/shared/page-header';
import CompanyListWrapper from '@/components/companies/company-list-wrapper';

export default async function CompaniesPage() {
  const initialCompanies = await getCompanies();

  // Safe array validation to prevent build errors
  const safeCompanies = Array.isArray(initialCompanies) ? initialCompanies : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Empresas" />
      <CompanyListWrapper initialCompanies={safeCompanies} />
    </div>
  );
}
