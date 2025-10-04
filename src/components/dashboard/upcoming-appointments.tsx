import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import type { Appointment, Patient } from '@/lib/types';
import { getPatients } from '@/lib/actions';
import { format } from 'date-fns';

interface UpcomingAppointmentsProps {
  appointments: (Appointment & { patient?: Patient })[];
}

export async function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
    const patients = await getPatients();
    const appointmentsWithPatients = appointments.map(appt => ({
        ...appt,
        patient: patients.find(p => p.id === appt.patientId)
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Citas</CardTitle>
      </CardHeader>
      <CardContent>
        {appointmentsWithPatients.length > 0 ? (
          <div className="space-y-4">
            {appointmentsWithPatients.map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={appointment.patient?.avatarUrl} alt={appointment.patient?.name} />
                  <AvatarFallback>{getInitials(appointment.patient?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{appointment.patient?.name}</p>
                  <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium">{format(new Date(appointment.date), 'p')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(appointment.date), 'MMM d')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay próximas citas.</p>
        )}
      </CardContent>
    </Card>
  );
}
