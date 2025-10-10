'use client';

import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser as deleteUserAction } from '@/lib/actions';
import { syncUserData } from '@/lib/user-sync';
import { useUserDetails } from '@/hooks/use-user-details';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus, 
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
import { User } from "@prisma/client";

// Mock data removed - now using database

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser } = useAuth();
  const { isAdmin, isSecretaria } = usePermissions();
  const MySwal = withReactContent(Swal);
  
  // Hook para cargar detalles de usuario (lazy loading)
  const { userDetails, isLoading: isLoadingDetails, error: detailsError, loadUserDetails, clearUserDetails } = useUserDetails();

  // Load users from database with pagination
  const loadUsers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      console.log(`🔄 Loading users - page: ${page}, size: ${pageSize}`);
      
      const result = await getUsers(page, pageSize);
      
      console.log(`✅ Users loaded:`, {
        users: result.users.length,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
      });
      
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalUsers(result.total);
      setCurrentPage(result.currentPage);
    } catch (error) {
      console.error('Error loading users:', error);
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

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'secretaria' as 'admin' | 'doctor' | 'secretaria' | 'patient' | 'promotora',
    phone: ''
  });

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

  // Función para verificar si se puede crear un usuario
  const canCreateUser = (): boolean => {
    return isAdmin(); // Solo admin puede crear usuarios
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
      case 'admin':
        return 'destructive';
      case 'doctor':
        return 'default';
      case 'secretaria':
        return 'secondary';
      case 'patient':
        return 'outline';
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
    
    // Cargar detalles completos del usuario (lazy loading)
    await loadUserDetails(user.id);
    
    setSelectedUser(user);
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
        const updatedUser = await updateUser(selectedUser.id, {
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          status: selectedUser.status,
        });
        
        console.log('✅ User updated successfully:', updatedUser);
        console.log('🔍 Updated user type:', typeof updatedUser);
        console.log('🔍 Updated user keys:', Object.keys(updatedUser));
        console.log('Current users before update:', users);
        
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id ? updatedUser : user
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
        console.log('🔄 Updated user patientId:', updatedUser.patientId);
        
        try {
          console.log('📞 Calling syncUserData function...');
          syncUserData(updatedUser);
          console.log('✅ syncUserData called successfully');
        } catch (error) {
          console.error('❌ Error calling syncUserData:', error);
          console.error('❌ Error details:', error.message);
          console.error('❌ Error stack:', error.stack);
        }
        
        // Usuario actualizado exitosamente
      } catch (error) {
        console.error('Error updating user:', error);
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

  const handleCreateUser = async () => {
    try {
      const userData = await createUser({
        name: newUser.name,
        email: newUser.email,
        password: 'TempPassword123!', // Default password, should be changed on first login
        role: newUser.role,
        status: 'ACTIVE',
        phone: null,
        lastLogin: null,
        patientId: null,
        avatarUrl: null // Se usará el valor por defecto de Prisma
      });
      
      setUsers([...users, userData]);
      setNewUser({ name: '', email: '', role: 'secretaria', phone: '' });
      setIsCreateDialogOpen(false);
      // Usuario creado exitosamente
    } catch (error) {
      console.error('Error creating user:', error);
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
          // Usuario eliminado exitosamente
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {canCreateUser() && (
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Agrega un nuevo usuario al sistema con los permisos correspondientes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserName">Nombre Completo</Label>
                <Input
                  id="newUserName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Ej: Dr. Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="usuario@urovital.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserPhone">Teléfono</Label>
                <Input
                  id="newUserPhone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+58 412-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserRole">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'doctor' | 'secretaria' | 'patient' | 'promotora') => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="secretaria">Secretaria</SelectItem>
                    <SelectItem value="patient">Paciente</SelectItem>
                    <SelectItem value="promotora">Promotora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'doctor' ? 'Doctor' : 
                       user.role === 'secretaria' ? 'Secretaria' :
                       user.role === 'patient' ? 'Paciente' :
                       user.role === 'promotora' ? 'Promotora' : 'Desconocido'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? formatDate(user.lastLogin.toISOString()) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.createdAt.toISOString())}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Botón para cambiar estado */}
                      {canEditUser(user) && (
                        <Button
                          variant={user.status === 'ACTIVE' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => cambiarEstadoUsuario(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
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

      {/* Dialog para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          clearUserDetails();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información y permisos del usuario.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando detalles del usuario...</p>
              </div>
            </div>
          ) : detailsError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar detalles: {detailsError}</p>
            </div>
          ) : selectedUser && (
            <div className="space-y-4">
              {/* Información adicional del usuario (lazy loaded) */}
              {userDetails && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Información Adicional</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Último acceso:</span>
                      <span className="ml-2">
                        {userDetails.lastLogin 
                          ? new Date(userDetails.lastLogin).toLocaleDateString()
                          : 'Nunca'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Registrado:</span>
                      <span className="ml-2">
                        {new Date(userDetails.createdAt).toLocaleDateString()}
                      </span>
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
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserEmail">Email</Label>
                <Input
                  id="editUserEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserPhone">Teléfono</Label>
                <Input
                  id="editUserPhone"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserRole">Rol</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: 'admin' | 'doctor' | 'secretaria' | 'patient' | 'promotora') => 
                    setSelectedUser({...selectedUser, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="secretaria">Secretaria</SelectItem>
                    <SelectItem value="patient">Paciente</SelectItem>
                    <SelectItem value="promotora">Promotora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserStatus">Estado</Label>
                <Select 
                  value={selectedUser.status} 
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE') => 
                    setSelectedUser({...selectedUser, status: value})
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
          <DialogFooter>
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
