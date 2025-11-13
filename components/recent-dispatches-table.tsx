"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-context"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function RecentDispatchesTable() {
  const { dispatches, silos, clients, drivers } = useData()

  const dispatchesWithRelations = dispatches
    .slice(-10)
    .reverse()
    .map((dispatch) => ({
      ...dispatch,
      silo: silos.find((s) => s.id === dispatch.silo_id),
      client: clients.find((c) => c.id === dispatch.client_id),
      driver: drivers.find((d) => d.id === dispatch.driver_id),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despachos Recientes</CardTitle>
        <CardDescription>Últimos 10 despachos registrados</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Conductor</TableHead>
              <TableHead>Silo</TableHead>
              <TableHead>Cantidad (m³)</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dispatchesWithRelations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No hay despachos registrados
                </TableCell>
              </TableRow>
            ) : (
              dispatchesWithRelations.map((dispatch) => (
                <TableRow key={dispatch.id}>
                  <TableCell>{dispatch.client?.name || "N/A"}</TableCell>
                  <TableCell>{dispatch.driver?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{dispatch.silo?.name || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{dispatch.quantity_m3.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(dispatch.dispatch_date), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
