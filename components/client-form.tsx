"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useData } from "@/lib/data-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function ClientForm() {
  const [name, setName] = useState("")
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { addClient } = useData()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      addClient({
        name,
        document,
        phone: phone || null,
        email: email || null,
        address: address || null,
      })

      router.push("/clients")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al guardar el cliente")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Registrar Cliente</CardTitle>
        <CardDescription>Completa los datos del nuevo cliente</CardDescription>
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
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información Básica</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre del Cliente <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo o razón social"
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document" className="text-sm font-medium">
                    Documento / RUC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="document"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="DNI, RUC o documento de identificación"
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Información de Contacto</h3>
              <div className="grid gap-4 md:grid-cols-2">
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Ubicación</h3>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Dirección
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección completa del cliente"
                  disabled={isLoading}
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
                "Guardar Cliente"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
