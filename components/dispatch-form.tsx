"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useData } from "@/lib/data-context"

export function DispatchForm() {
  const { addDispatch, clients, drivers, silos } = useData()
  const [clientId, setClientId] = useState("")
  const [driverId, setDriverId] = useState("")
  const [siloId, setSiloId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [resistance, setResistance] = useState("")
  const [cementType, setCementType] = useState("")
  const [slump, setSlump] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const selectedSilo = silos.find((s) => s.id === siloId)
  const hasInsufficientStock = selectedSilo && Number(quantity) > selectedSilo.current_stock

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (hasInsufficientStock) {
        throw new Error("Stock insuficiente en el silo seleccionado")
      }

      addDispatch({
        client_id: clientId,
        driver_id: driverId,
        silo_id: siloId,
        quantity_m3: Number(quantity),
        dispatch_date: new Date().toISOString(),
        resistance: resistance || null,
        cement_type: cementType || null,
        slump: slump || null,
        notes: notes || null,
      })

      router.push("/dispatches")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al guardar el despacho")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Registrar Despacho</CardTitle>
        <CardDescription>Completa los datos del despacho de cemento</CardDescription>
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
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Principal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-sm font-medium">
                    Cliente <span className="text-red-500">*</span>
                  </Label>
                  <Select value={clientId} onValueChange={setClientId} required disabled={isLoading}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver" className="text-sm font-medium">
                    Conductor <span className="text-red-500">*</span>
                  </Label>
                  <Select value={driverId} onValueChange={setDriverId} required disabled={isLoading}>
                    <SelectTrigger id="driver">
                      <SelectValue placeholder="Seleccionar conductor" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} - {driver.license}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Detalles del Despacho</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="silo" className="text-sm font-medium">
                    Silo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={siloId} onValueChange={setSiloId} required disabled={isLoading}>
                    <SelectTrigger id="silo">
                      <SelectValue placeholder="Seleccionar silo" />
                    </SelectTrigger>
                    <SelectContent>
                      {silos.map((silo) => (
                        <SelectItem key={silo.id} value={silo.id}>
                          {silo.name} - {silo.current_stock.toFixed(2)} m³ disponibles
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Cantidad (m³) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {hasInsufficientStock && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Stock insuficiente. Disponible: {selectedSilo.current_stock.toFixed(2)} m³
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Especificaciones Técnicas</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="resistance" className="text-sm font-medium">
                    Resistencia
                  </Label>
                  <Input
                    id="resistance"
                    placeholder="210, 280"
                    value={resistance}
                    onChange={(e) => setResistance(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cementType" className="text-sm font-medium">
                    Tipo de Cemento
                  </Label>
                  <Input
                    id="cementType"
                    placeholder="I, II, V"
                    value={cementType}
                    onChange={(e) => setCementType(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slump" className="text-sm font-medium">
                    Asentamiento
                  </Label>
                  <Input
                    id="slump"
                    placeholder="3, 4, 5"
                    value={slump}
                    onChange={(e) => setSlump(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Adicional</h3>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  placeholder="Agregar observaciones o instrucciones especiales..."
                  rows={3}
                  className="resize-none"
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
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || hasInsufficientStock} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Despacho"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
