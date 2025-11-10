'use client';

import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  Search, 
  User, 
  Calendar,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AuditoriaPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { isAdmin } = usePermissions();

  // Load audit logs from database
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        const logsData = await getAuditLogs();
        setAuditLogs(logsData);
      } catch (error) {
        if (error instanceof Error) {
          toast({ variant: "destructive", title: "Error", description: error.message });
        } else {
          toast({ variant: "destructive", title: "Error desconocido" });
        }
      } finally {
        setLoading(false);
      }
    };
    loadAuditLogs();
  }, [toast]);

  const filteredLogs = auditLogs.filter(log =>
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'destructive';
      case 'DOCTOR':
      case 'doctor':
        return 'default';
      case 'SECRETARIA':
      case 'secretaria':
        return 'secondary';
      case 'USER':
      case 'user':
        return 'outline';
      case 'PROMOTORA':
      case 'promotora':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'Administrador';
      case 'DOCTOR':
      case 'doctor':
        return 'Doctor';
      case 'SECRETARIA':
      case 'secretaria':
        return 'Secretaria';
      case 'USER':
      case 'user':
      case 'patient':  // Mantener por compatibilidad UI
        return 'Paciente';
      case 'PROMOTORA':
      case 'promotora':
        return 'Promotora';
      default:
        return 'Desconocido';
    }
  };

  // Check if user has permission to view audit logs
  if (!isAdmin()) {
    return (
      <div className="flex flex-col gap-8">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-muted-foreground">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder al módulo de auditoría.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Auditoría del Sistema</h2>
          <p className="text-muted-foreground">
            Registro de todas las actividades y eventos del sistema.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">
                  {new Set(auditLogs.map(log => log.userId)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos Hoy</p>
                <p className="text-2xl font-bold">
                  {auditLogs.filter(log => {
                    const logDate = new Date(log.createdAt);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividades</CardTitle>
          <CardDescription>
            Historial completo de todas las acciones realizadas en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por usuario, email o acción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Cargando registros de auditoría...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros de auditoría.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-sm text-muted-foreground">{log.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(log.user.role)}>
                          {getRoleDisplayName(log.user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.action}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.details || 'Sin detalles'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(log.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
