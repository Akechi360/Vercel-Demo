import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function PreferencesPage() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Preferencias</CardTitle>
        <CardDescription>Administra tu idioma y configuración de notificaciones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language">Idioma</Label>
          <Select defaultValue="es">
            <SelectTrigger id="language" className="w-[200px]">
              <SelectValue placeholder="Seleccionar idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notificaciones por Email</Label>
          <div className="flex items-center space-x-4">
            <Button variant="outline">Todas</Button>
            <Button variant="outline">Solo menciones</Button>
            <Button variant="destructive">Ninguna</Button>
          </div>
        </div>
        <Button>Guardar Preferencias</Button>
      </CardContent>
    </Card>
  )
}
