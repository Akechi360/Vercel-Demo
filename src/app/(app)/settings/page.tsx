'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Database,
  Bell,
  Shield,
  Globe
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUsers, getPatients, getAppointments, getPayments } from '@/lib/actions';

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState({
    clinicName: 'UroVital',
    clinicAddress: 'Valencia, Edo. Carabobo',
    clinicPhone: '+58 412-177 2206',
    clinicEmail: 'info@urovital.com',
    workingHours: 'Lun - Vie: 9am - 5pm',
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
    autoBackup: true,
    dataRetention: '2 años'
  });

  const [stats, setStats] = useState([
    { label: 'Usuarios Registrados', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Pacientes Activos', value: '0', icon: Users, color: 'text-green-600' },
    { label: 'Citas del Mes', value: '0', icon: Calendar, color: 'text-purple-600' },
    { label: 'Ingresos del Mes', value: '$0', icon: CreditCard, color: 'text-orange-600' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersResult, patients, appointments, payments] = await Promise.all([
          getUsers(),
          getPatients(),
          getAppointments(),
          getPayments()
        ]);

        // Extraer el array de usuarios del objeto paginado
        const users = usersResult.users;

        // Safe array validation to prevent build errors
        const safeUsers = Array.isArray(users) ? users : [];
        const safePatients = Array.isArray(patients) ? patients : [];
        const safeAppointments = Array.isArray(appointments) ? appointments : [];
        const safePayments = Array.isArray(payments) ? payments : [];

        // Calcular estadísticas del mes actual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyAppointments = safeAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
        });

        const monthlyPayments = safePayments.filter(payment => {
          const paymentDate = new Date(payment.date);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        });

        const totalIncome = monthlyPayments.reduce((sum, payment) => {
          const amount = typeof payment.monto === 'number' ? payment.monto : 0;
          return sum + amount;
        }, 0);

        setStats([
          { 
            label: 'Usuarios Registrados', 
            value: safeUsers.length.toLocaleString(), 
            icon: Users, 
            color: 'text-blue-600' 
          },
          { 
            label: 'Pacientes Activos', 
            value: safePatients.filter(p => p.status === 'Activo').length.toLocaleString(), 
            icon: Users, 
            color: 'text-green-600' 
          },
          { 
            label: 'Citas del Mes', 
            value: monthlyAppointments.length.toLocaleString(), 
            icon: Calendar, 
            color: 'text-purple-600' 
          },
          { 
            label: 'Ingresos del Mes', 
            value: `$${totalIncome.toLocaleString()}`, 
            icon: CreditCard, 
            color: 'text-orange-600' 
          },
        ]);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Set default stats on error
        setStats([
          { label: 'Usuarios Registrados', value: '0', icon: Users, color: 'text-blue-600' },
          { label: 'Pacientes Activos', value: '0', icon: Users, color: 'text-green-600' },
          { label: 'Citas del Mes', value: '0', icon: Calendar, color: 'text-purple-600' },
          { label: 'Ingresos del Mes', value: '$0', icon: CreditCard, color: 'text-orange-600' },
        ]);
      }
    };

    fetchStats();
  }, []);

  const handleSave = () => {
    // Aquí se implementaría la lógica para guardar la configuración
    console.log('Guardando configuración:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración General</h2>
        <p className="text-muted-foreground">
          Administra la configuración general del sistema y monitorea el estado de la aplicación.
        </p>
      </div>

      {/* Estadísticas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la Clínica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Clínica
            </CardTitle>
            <CardDescription>
              Configura la información básica de tu clínica o consultorio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Nombre de la Clínica</Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(e) => setSettings({...settings, clinicName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicAddress">Dirección</Label>
              <Textarea
                id="clinicAddress"
                value={settings.clinicAddress}
                onChange={(e) => setSettings({...settings, clinicAddress: e.target.value})}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinicPhone">Teléfono</Label>
                <Input
                  id="clinicPhone"
                  value={settings.clinicPhone}
                  onChange={(e) => setSettings({...settings, clinicPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicEmail">Email</Label>
                <Input
                  id="clinicEmail"
                  type="email"
                  value={settings.clinicEmail}
                  onChange={(e) => setSettings({...settings, clinicEmail: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">Horario de Atención</Label>
              <Input
                id="workingHours"
                value={settings.workingHours}
                onChange={(e) => setSettings({...settings, workingHours: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription>
              Ajustes de seguridad y funcionamiento del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones Generales</Label>
                <p className="text-sm text-muted-foreground">
                  Activar notificaciones del sistema
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => setSettings({...settings, notifications: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones por correo electrónico
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificaciones SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones por mensaje de texto
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Mantenimiento</Label>
                <p className="text-sm text-muted-foreground">
                  Activar modo mantenimiento del sistema
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Respaldo Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Realizar respaldos automáticos de la base de datos
                </p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dataRetention">Retención de Datos</Label>
              <Input
                id="dataRetention"
                value={settings.dataRetention}
                onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Monitorea el estado de los servicios y componentes del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Base de Datos</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Conectada
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Servidor Web</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Activo
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Notificaciones</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Funcionando
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[120px]">
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
