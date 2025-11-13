"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface DriverFormProps {
  userId: string
  initialData?: any
}

export function DriverForm({ userId, initialData }: DriverFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [licenseNumber, setLicenseNumber] = useState(initialData?.license_number || "")
  const [phone, setPhone] = useState(initialData?.phone || "")
  const [vehiclePlate, setVehiclePlate] = useState(initialData?.vehicle_plate || "")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const driverData = {
        name,
        license_number: licenseNumber,
        phone: phone || null,
        vehicle_plate: vehiclePlate || null,
        created_by: userId,
      }

      if (initialData) {
        const { error } = await supabase.from("drivers").update(driverData).eq("id", initialData.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("drivers").insert(driverData)

        if (error) throw error
      }

      router.push("/drivers")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al guardar el conductor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{initialData ? "Editar" : "Registrar"} Conductor</CardTitle>
        <CardDescription>Completa los datos del conductor</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Personal</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo del conductor"
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-sm font-medium">
                    Número de Licencia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Ej: Q12345678"
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información de Contacto</h3>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+51 999 999 999"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información del Vehículo</h3>
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate" className="text-sm font-medium">
                  Placa del Vehículo
                </Label>
                <Input
                  id="vehiclePlate"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Ej: ABC-123"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 h-11">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Conductor"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
