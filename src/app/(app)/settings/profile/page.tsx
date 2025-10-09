'use client';

import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/layout/auth-provider"
import { useState, useRef } from "react"
import { updateUser } from "@/lib/actions"
import { Upload, X } from "lucide-react"

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatarUrl: currentUser?.avatarUrl || '',
  });

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await updateUser(currentUser.id, {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
      });
      
      // Perfil actualizado exitosamente
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      avatarUrl: currentUser?.avatarUrl || '',
    });
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      // Tipo de archivo no válido
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      // Archivo demasiado grande
      return;
    }

    // Convertir a URL para preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData({ ...formData, avatarUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatarUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Actualiza tu información personal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        {currentUser?.role === 'doctor' && (
          <div className="space-y-4">
            <Label>Foto de Perfil</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {formData.avatarUrl ? (
                  <AvatarImage src={formData.avatarUrl} alt={formData.name} />
                ) : null}
                <AvatarFallback className="text-lg">
                  {formData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isEditing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.avatarUrl ? 'Cambiar' : 'Subir'}
                  </Button>
                  {formData.avatarUrl && isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG o WebP. Máximo 2MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Input 
            id="role" 
            value={currentUser?.role || ''} 
            disabled 
            className="bg-muted"
          />
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Editar Perfil
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
