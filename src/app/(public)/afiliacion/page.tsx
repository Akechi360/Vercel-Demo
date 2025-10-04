import { AffiliateEnrollment } from "@/components/public/affiliate-enrollment";

export default function AfiliacionPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
        {/* Fondo limpio para evitar líneas de división visibles */}
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        <AffiliateEnrollment />
    </div>
  );
}
