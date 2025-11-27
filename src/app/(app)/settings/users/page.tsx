'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser as deleteUserAction } from '@/lib/actions';
import { syncUserData } from '@/lib/user-sync';
import { useUserDetails } from '@/hooks/use-user-details';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/components/layout/auth-provider';
import { usePermissions } from '@/hooks/use-permissions';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { User, UserRole } from "@prisma/client";

// Mock data removed - now using database
// Force HMR update

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User & { specialty?: string; cedula?: string; telefono?: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { currentUser } = useAuth();
  const { isAdmin, isSecretaria } = usePermissions();
  const MySwal = withReactContent(Swal);

  // Hook para cargar detalles de usuario (lazy loading) - solo se inicializa cuando se necesita
  const { userDetails, isLoading: isLoadingDetails, error: detailsError, loadUserDetails, clearUserDetails } = useUserDetails();

  // Load users from database with pagination
  const loadUsers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      const startTime = performance.now();
      console.log(`🔄 Loading users - page: ${page}, size: ${pageSize}`);

      const result = await getUsers(page, pageSize);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`✅ Users loaded in ${loadTime.toFixed(2)}ms:`, {
        users: result.users.length,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        loadTime: `${loadTime.toFixed(2)}ms`,
      });

      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalUsers(result.total);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar usuarios';
      console.error('Error details:', errorMessage);
      setUsers([]);
      setTotalPages(0);
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on component mount and when page changes
  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  // Funciones de navegación de páginas
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(0);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages - 1);
  };

  // Función para verificar si un usuario puede ser editado
  const canEditUser = (user: User): boolean => {
    if (isAdmin()) return true; // Admin puede editar a todos
    if (isSecretaria()) {
      // Secretaria solo puede editar pacientes (que no aparecen en esta lista)
      // No puede editar doctores ni admins
      return false;
    }
    return false;
  };

  // Función para verificar si se puede eliminar un usuario
  const canDeleteUser = (user: User): boolean => {
    if (isAdmin()) return true; // Admin puede eliminar a todos
    return false; // Secretaria no puede eliminar usuarios
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'admin':
        return 'destructive';
      case 'DOCTOR':
      case 'doctor':
      case 'Doctor':
        return 'default';
      case 'SECRETARIA':
      case 'secretaria':
        return 'secondary';
      case 'USER':
      case 'user':
      case 'patient':  // Mantener por compatibilidad UI
        return 'outline';
      case 'PROMOTORA':
      case 'promotora':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'ACTIVE' ? 'default' : 'secondary';
  };

  const handleEditUser = async (user: User) => {
    console.log(`🔄 Opening edit dialog for user: ${user.id}`);
    console.log('🔍 User from list has specialty?:', (user as any).specialty);

    // Cargar detalles completos del usuario (lazy loading)
    const details = await loadUserDetails(user.id);
    console.log('🔍 Details loaded:', details);
    console.log('🔍 Doctor info:', details?.doctorInfo);

    // Si es doctor, intentar obtener la especialidad y otros datos de los detalles cargados
    let specialty = '';
    let cedula = '';
    let telefono = '';

    if (user.role === 'DOCTOR' && details?.doctorInfo) {
      specialty = details.doctorInfo.especialidad || '';
      cedula = details.doctorInfo.cedula || '';
      telefono = details.doctorInfo.telefono || '';
      console.log('🔍 Loaded specialty from DB:', specialty);
    }

    setSelectedUser({ ...user, specialty, cedula, telefono });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (selectedUser) {
      try {
        console.log('🔄 Starting user update process...');
        console.log('📝 Updating user:', selectedUser.id, {
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          status: selectedUser.status,
        });

        console.log('📞 Calling updateUser function...');
        console.log('🔍 selectedUser.specialty:', selectedUser.specialty);

        console.log('🔍 selectedUser.cedula:', selectedUser.cedula);
        console.log('🔍 selectedUser.telefono:', selectedUser.telefono);
        console.log('🔍 Full selectedUser:', selectedUser);

        const updatedUser = await updateUser(selectedUser.id, {
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role, // Sin cast, se normaliza en actions.ts
          status: selectedUser.status,
          userId: selectedUser.userId,
          specialty: selectedUser.specialty,
          cedula: selectedUser.cedula,
          telefono: selectedUser.telefono
        } as any);

        console.log('✅ User updated successfully:', updatedUser);
        console.log('🔍 Updated user type:', typeof updatedUser);
        console.log('🔍 Updated user keys:', Object.keys(updatedUser));
        console.log('Current users before update:', users);

        // updatedUser doesn't include doctor-specific fields (specialty, cedula, telefono)
        // because they're in DoctorInfo relation, not in User model
        // So we need to preserve them from selectedUser
        const updatedUsers = users.map(user =>
          user.id === selectedUser.id ? {
            ...updatedUser,
            specialty: selectedUser.specialty,
            cedula: selectedUser.cedula,
            telefono: selectedUser.telefono
          } : user
        );

        console.log('Updated users array:', updatedUsers);
        setUsers(updatedUsers);
        setIsEditDialogOpen(false);
        setSelectedUser(null);

        // Sync user data in localStorage if this affects the current user
        console.log('🔄 About to call syncUserData with:', updatedUser);
        console.log('🔄 Updated user ID:', updatedUser.id);
        console.log('🔄 Updated user status:', updatedUser.status);
        console.log('🔄 Updated user role:', updatedUser.role);
        console.log('🔄 Updated user userId:', updatedUser.userId);

        try {
          console.log('📞 Calling syncUserData function...');
          syncUserData(updatedUser);
          console.log('✅ syncUserData called successfully');
        } catch (error) {
          console.error('❌ Error calling syncUserData:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          const errorStack = error instanceof Error ? error.stack : 'No stack available';
          console.error('❌ Error details:', errorMessage);
          console.error('❌ Error stack:', errorStack);
        }

        // Usuario actualizado exitosamente
      } catch (error) {
        console.error('Error updating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al actualizar usuario';
        console.error('Error details:', errorMessage);
      }
    }
  };

  // Función para cambiar el estado de un usuario directamente
  const cambiarEstadoUsuario = async (userId: string, nuevoEstado: 'ACTIVE' | 'INACTIVE') => {
    try {
      console.log('🔄 Cambiando estado de usuario:', userId, 'a:', nuevoEstado);

      const response = await fetch('/api/user/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nuevoEstado }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar el estado del usuario');
      }

      const updatedUser = await response.json();
      console.log('✅ Estado actualizado exitosamente:', updatedUser);

      // Actualizar la lista de usuarios localmente
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, status: nuevoEstado } : user
      );
      setUsers(updatedUsers);

      // Mostrar confirmación
      const isDarkMode = document.documentElement.classList.contains('dark');
      MySwal.fire({
        title: 'Estado actualizado',
        text: `El usuario ha sido ${nuevoEstado === 'ACTIVE' ? 'activado' : 'desactivado'} exitosamente.`,
        icon: 'success',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#0f172a',
      });

    } catch (error) {
      console.error('❌ Error al cambiar estado del usuario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado del usuario';
      console.error('Error details:', errorMessage);

      const isDarkMode = document.documentElement.classList.contains('dark');
      MySwal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Error al cambiar el estado del usuario',
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f1f5f9' : '#0f172a',
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    const isDarkMode = document.documentElement.classList.contains('dark');

    MySwal.fire({
      title: '¿Eliminar usuario?',
      text: `Esta acción eliminará permanentemente a ${userToDelete?.name} y todos sus datos asociados del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUserAction(userId);
          setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
          console.error('Error deleting user:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar usuario';
          console.error('Error details:', errorMessage);
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus permisos.
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Página Actual</p>
                <p className="text-2xl font-bold">{currentPage + 1} / {totalPages}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios en Página</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado de Carga</p>
                <p className="text-2xl font-bold">{isLoading ? 'Cargando...' : 'Listo'}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Busca y gestiona los usuarios registrados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{user.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="whitespace-nowrap">
                          {user.role === 'ADMIN' ? 'Admin' :
                            user.role === 'DOCTOR' ? 'Doctor' :
                              user.role === 'SECRETARIA' ? 'Secretaria' :
                                user.role === 'USER' ? 'Paciente' :
                                  user.role === 'PROMOTORA' ? 'Promotora' : 'Desconocido'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(user.status)} className="whitespace-nowrap">
                          {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{formatDate(user.createdAt.toISOString())}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      {canEditUser(user) && (
                        <Button
                          variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => cambiarEstadoUsuario(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          className="flex-1"
                        >
                          {user.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                        </Button>
                      )}
                      {canEditUser(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteUser(user) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <div className="w-full">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Usuario</TableHead>
                        <TableHead className="w-[12%]">Rol</TableHead>
                        <TableHead className="w-[10%]">Estado</TableHead>
                        <TableHead className="w-[15%]">Último Acceso</TableHead>
                        <TableHead className="w-[15%]">Fecha de Registro</TableHead>
                        <TableHead className="text-right w-[18%]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <TableRow
                          key={user.id}
                          className={cn(
                            "hover:bg-muted/50 transition-colors",
                            index % 2 === 0 ? "bg-muted/20" : "bg-transparent"
                          )}
                        >
                          <TableCell className="py-4">
                            <div className="max-w-full overflow-hidden">
                              <div className="font-medium truncate">{user.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant={getRoleBadgeVariant(user.role)} className="whitespace-nowrap">
                              {user.role === 'ADMIN' ? 'Admin' :
                                user.role === 'DOCTOR' ? 'Doctor' :
                                  user.role === 'SECRETARIA' ? 'Secretaria' :
                                    user.role === 'USER' ? 'Paciente' :
                                      user.role === 'PROMOTORA' ? 'Promotora' : 'Desconocido'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant={getStatusBadgeVariant(user.status)} className="whitespace-nowrap">
                              {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm py-4">
                            <span className="truncate block">{user.lastLogin ? formatDate(user.lastLogin.toISOString()) : 'Nunca'}</span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{formatDate(user.createdAt.toISOString())}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              {canEditUser(user) && (
                                <Button
                                  variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => cambiarEstadoUsuario(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                                  className="whitespace-nowrap"
                                >
                                  {user.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                                </Button>
                              )}
                              {canEditUser(user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteUser(user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Mostrando {users.length} de {totalUsers} usuarios
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 0 || isLoading}
                >
                  Primera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0 || isLoading}
                >
                  Anterior
                </Button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    const pageNum = startPage + i;

                    if (pageNum >= totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1 || isLoading}
                >
                  Siguiente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages - 1 || isLoading}
                >
                  Última
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] w-full p-6 py-4">
            <div className="pr-4">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : detailsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error al cargar detalles: {detailsError}</p>
                </div>
              ) : selectedUser && (
                <div className="space-y-4">
                  {/* Información adicional del usuario (lazy loaded) */}
                  {userDetails && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Información Adicional</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Último acceso</label>
                          <div className="text-sm">
                            {userDetails.lastLogin
                              ? new Date(userDetails.lastLogin).toLocaleDateString()
                              : 'Nunca'
                            }
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Registrado</label>
                          <div className="text-sm">
                            {new Date(userDetails.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {userDetails.patient && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Paciente:</span>
                            <span className="ml-2">
                              {userDetails.patient.nombre} {userDetails.patient.apellido} (C.I: {userDetails.patient.cedula})
                            </span>
                          </div>
                        )}
                        {userDetails.payments && userDetails.payments.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Últimos pagos:</span>
                            <span className="ml-2">
                              {userDetails.payments.length} pagos registrados
                            </span>
                          </div>
                        )}
                        {userDetails.appointments && userDetails.appointments.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Citas:</span>
                            <span className="ml-2">
                              {userDetails.appointments.length} citas registradas
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="editUserName">Nombre Completo</Label>
                    <Input
                      id="editUserName"
                      value={selectedUser.name}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUserEmail">Email</Label>
                    <Input
                      id="editUserEmail"
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUserPhone">Teléfono</Label>
                    <Input
                      id="editUserPhone"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUserRole">Rol</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value: 'ADMIN' | 'DOCTOR' | 'SECRETARIA' | 'USER' | 'PROMOTORA') =>
                        setSelectedUser({ ...selectedUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="SECRETARIA">Secretaria</SelectItem>
                        <SelectItem value="USER">Paciente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campos específicos para doctores */}
                  {selectedUser.role === 'DOCTOR' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="editUserSpecialty">Especialidad</Label>
                        <Select
                          value={selectedUser.specialty || ''}
                          onValueChange={(value) => setSelectedUser({ ...selectedUser, specialty: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar especialidad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Urología">Urología</SelectItem>
                            <SelectItem value="Ginecología">Ginecología</SelectItem>
                            <SelectItem value="Oncología">Oncología</SelectItem>
                            <SelectItem value="Uroginecología">Uroginecología</SelectItem>
                            <SelectItem value="Medicina General">Medicina General</SelectItem>
                            <SelectItem value="Pediatría">Pediatría</SelectItem>
                            <SelectItem value="Cardiología">Cardiología</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editUserCedula">Cédula Profesional</Label>
                        <Input
                          id="editUserCedula"
                          value={selectedUser.cedula || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, cedula: e.target.value })}
                          placeholder="Ej: MD-123456"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editUserPhone">Teléfono de Contacto</Label>
                        <Input
                          id="editUserPhone"
                          value={selectedUser.telefono || ''}
                          onChange={(e) => setSelectedUser({ ...selectedUser, telefono: e.target.value })}
                          placeholder="Ej: +58 412-1234567"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="editUserStatus">Estado</Label>
                    <Select
                      value={selectedUser.status}
                      onValueChange={(value: 'ACTIVE' | 'INACTIVE') =>
                        setSelectedUser({ ...selectedUser, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}