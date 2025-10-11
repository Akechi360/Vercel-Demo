import { getUserStatusForAccess } from '@/lib/actions';
import { RestrictedNotice } from './RestrictedNotice';

interface ServerPatientAccessGateProps {
  userId: string;
  children: React.ReactNode;
}

export async function ServerPatientAccessGate({ userId, children }: ServerPatientAccessGateProps) {
  // Get fresh user data from database (no cache)
  const userStatus = await getUserStatusForAccess(userId);
  
  if (!userStatus) {
    // If user not found, show restricted access
    return <RestrictedNotice />;
  }

  // Check if user is a patient with restricted access
  const isRestricted = userStatus.role === 'patient' && 
    (userStatus.status === 'INACTIVE' || !userStatus.patientId);

  if (isRestricted) {
    return <RestrictedNotice />;
  }

  // User has access, show content
  return <>{children}</>;
}
