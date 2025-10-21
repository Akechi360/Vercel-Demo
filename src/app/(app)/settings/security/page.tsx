import { CardTitle, CardDescription, CardHeader, CardContent, Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SecurityPage() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Cambia tu contraseña.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="current-password">Contraseña Actual</Label>
          <Input id="current-password" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nueva Contraseña</Label>
          <Input id="new-password" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
          <Input id="confirm-password" type="password" />
        </div>
        <Button>Cambiar Contraseña</Button>
      </CardContent>
    </Card>
  )
}
