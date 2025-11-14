"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useMemo } from "react"
import { formatKg, formatM3 } from "@/lib/format-utils"

export function RecentDispatchesTable() {
  const { dispatches, silos, clients, drivers } = useData()

  const dispatchesWithRelations = useMemo(() => 
    dispatches
      .map((dispatch) => ({
        ...dispatch,
        silo: silos.find((s) => s.id === dispatch.silo_id),
        client: clients.find((c) => c.id === dispatch.client_id),
        driver: drivers.find((d) => d.id === dispatch.driver_id),
      }))
      .sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
      .slice(0, 20),
    [dispatches, silos, clients, drivers]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despachos Recientes</CardTitle>
        <CardDescription>Últimos 20 despachos registrados (Total: {dispatches.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Silo</TableHead>
                <TableHead className="text-right">Cantidad M³</TableHead>
                <TableHead className="text-right">Cantidad Kg</TableHead>
                <TableHead>REST</TableHead>
                <TableHead>TIPO</TableHead>
                <TableHead>ASENT.</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatchesWithRelations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-slate-500">
                    No hay despachos registrados
                  </TableCell>
                </TableRow>
              ) : (
                dispatchesWithRelations.map((dispatch) => {
                  const clientName = dispatch.client?.name || (dispatch.client_id?.startsWith('manual_') ? dispatch.client_id.replace('manual_', '') : "N/A")
                  const driverName = dispatch.driver?.name || (dispatch.driver_id?.startsWith('manual_') ? dispatch.driver_id.replace('manual_', '') : "N/A")
                  
                  return (
                    <TableRow key={dispatch.id}>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{driverName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dispatch.silo?.name || "N/A"}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-right">{formatM3(dispatch.quantity_m3)}</TableCell>
                      <TableCell className="font-semibold tabular-nums text-right">{formatKg(dispatch.quantity_kg, 0)}</TableCell>
                      <TableCell className="text-sm">{dispatch.resistance || "-"}</TableCell>
                      <TableCell className="text-sm">{dispatch.cement_type || "-"}</TableCell>
                      <TableCell className="text-sm">{dispatch.slump || "-"}</TableCell>
                      <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                        {format(new Date(dispatch.dispatch_date), "dd MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
