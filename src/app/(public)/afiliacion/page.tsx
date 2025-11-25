import { AffiliateEnrollment } from "@/components/public/affiliate-enrollment";
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AfiliacionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-4xl">
        <AffiliateEnrollment />
      </div>
    </main>
  );
}