"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useData, type Silo } from "@/lib/data-context"
import { AlertTriangle, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { formatKg, formatPercentage } from "@/lib/format-utils"

export function SiloInventoryCards() {
  const { silos, updateSilo } = useData()
  const [fillDialogOpen, setFillDialogOpen] = useState(false)
  const [selectedSilo, setSelectedSilo] = useState<Silo | null>(null)
  const [fillAmount, setFillAmount] = useState("")

  const handleSiloClick = (silo: Silo) => {
    setSelectedSilo(silo)
    setFillAmount("")
    setFillDialogOpen(true)
  }

  const handleFillSilo = () => {
    if (!selectedSilo || !fillAmount || Number(fillAmount) <= 0) {
      toast.error("Por favor ingresa una cantidad válida")
      return
    }

    const amount = Number(fillAmount)
    const newStock = selectedSilo.current_stock + amount

    if (newStock > selectedSilo.capacity) {
      toast.error(`La cantidad excede la capacidad del silo (${selectedSilo.capacity} Kg)`)
      return
    }

    updateSilo(selectedSilo.id, { current_stock: newStock })
    toast.success(`Silo ${selectedSilo.name} llenado con ${formatKg(amount, 0)}`)
    setFillDialogOpen(false)
    setSelectedSilo(null)
    setFillAmount("")
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {silos.map((silo) => {
          const percentage = (silo.current_stock / silo.capacity) * 100
          const isLow = silo.current_stock < silo.min_stock

          return (
            <Card 
              key={silo.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${isLow ? "border-orange-500" : ""}`}
              onClick={() => handleSiloClick(silo)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{silo.name}</CardTitle>
                  <Badge variant="default">Activo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900">{formatKg(silo.current_stock, 0)}</span>
                  <span className="text-sm text-slate-600">/ {formatKg(silo.capacity, 0)}</span>
                </div>

                <Progress value={percentage} className="h-2" />

                <div className="flex items-center justify-between text-sm">
                  <span className={isLow ? "text-orange-600 font-medium" : "text-slate-600"}>
                    {formatPercentage(percentage)} capacidad
                  </span>
                  {isLow && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSiloClick(silo)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Llenar Silo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={fillDialogOpen} onOpenChange={setFillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Llenar Silo {selectedSilo?.name}</DialogTitle>
            <DialogDescription>
              Ingresa la cantidad de cemento a agregar al silo. Capacidad disponible:{" "}
              <span className="font-semibold">
                {selectedSilo ? formatKg(selectedSilo.capacity - selectedSilo.current_stock, 0) : formatKg(0, 0)}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fill-amount">Cantidad a agregar (Kg)</Label>
              <Input
                id="fill-amount"
                type="number"
                step="0.01"
                min="0"
                max={selectedSilo ? selectedSilo.capacity - selectedSilo.current_stock : 0}
                placeholder="Ej: 1000"
                value={fillAmount}
                onChange={(e) => setFillAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFillSilo()
                  }
                }}
              />
            </div>

            {selectedSilo && (
              <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Stock actual:</span>
                  <span className="font-semibold">{formatKg(selectedSilo.current_stock, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cantidad a agregar:</span>
                  <span className="font-semibold">{fillAmount ? formatKg(Number(fillAmount), 0) : formatKg(0, 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-600">Nuevo stock:</span>
                  <span className="font-bold text-blue-600">
                    {formatKg(selectedSilo.current_stock + (Number(fillAmount) || 0), 0)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFillDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFillSilo}>
              <Plus className="h-4 w-4 mr-2" />
              Llenar Silo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
