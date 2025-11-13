"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { AlertTriangle } from "lucide-react"

export function SiloInventoryCards() {
  const { silos } = useData()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {silos.map((silo) => {
        const percentage = (silo.current_stock / silo.capacity) * 100
        const isLow = silo.current_stock < silo.min_stock

        return (
          <Card key={silo.id} className={isLow ? "border-orange-500" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{silo.name}</CardTitle>
                <Badge variant="default">Activo</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{silo.current_stock.toFixed(2)}</span>
                <span className="text-sm text-slate-600">/ {silo.capacity.toFixed(2)} m³</span>
              </div>

              <Progress value={percentage} className="h-2" />

              <div className="flex items-center justify-between text-sm">
                <span className={isLow ? "text-orange-600 font-medium" : "text-slate-600"}>
                  {percentage.toFixed(1)}% capacidad
                </span>
                {isLow && <AlertTriangle className="h-4 w-4 text-orange-600" />}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
