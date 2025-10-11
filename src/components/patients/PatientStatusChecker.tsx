import { getCurrentUserFresh } from '@/lib/actions';
import { getCurrentUserWithStatus } from '@/lib/actions';

interface PatientStatusCheckerProps {
  userId: string;
  children: React.ReactNode;
}

export async function PatientStatusChecker({ userId, children }: PatientStatusCheckerProps) {
  try {
    // Get fresh user data from database (no cache)
    const user = await getCurrentUserFresh(userId);
    
    if (!user) {
      return <div>Error: Usuario no encontrado</div>;
    }

    // Check if user is a patient with restrictions
    const isRestricted = user.role === 'patient' && (user.status === 'INACTIVE' || !user.patientId);
    
    if (isRestricted) {
      // Import and render RestrictedNotice
      const { RestrictedNotice } = await import('./RestrictedNotice');
      return <RestrictedNotice />;
    }

    // User has access, render children
    return <>{children}</>;
  } catch (error) {
    console.error('Error checking patient status:', error);
    return <div>Error: No se pudo verificar el estado del usuario</div>;
  }
}
