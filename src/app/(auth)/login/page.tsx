import AuthForm from '@/components/auth/auth-form';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-6xl">
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
