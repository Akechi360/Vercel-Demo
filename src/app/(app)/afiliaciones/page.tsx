// src/app/(app)/afiliaciones/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AffiliationStatCards } from "@/components/affiliations/stat-cards";
import { getAffiliations } from "@/lib/actions";
import { AfiliacionesPageClient } from "./afiliaciones-page-client";


export default async function AfiliacionesPage() {
  const affiliations = await getAffiliations();
  
  return (
    <AfiliacionesPageClient initialAffiliations={affiliations} />
  );
}
