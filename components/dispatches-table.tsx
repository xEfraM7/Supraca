"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { useData, type Profile } from "@/lib/data-context"
import { Search, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"

interface DispatchesTableProps {
  profile: Profile
}

export function DispatchesTable({ profile }: DispatchesTableProps) {
  const { dispatches, silos, clients, drivers } = useData()
  const [searchTerm, setSearchTerm] = useState("")

  const dispatchesWithRelations = useMemo(
    () =>
      dispatches.map((dispatch) => ({
        ...dispatch,
        silo: silos.find((s) => s.id === dispatch.silo_id),
        client: clients.find((c) => c.id === dispatch.client_id),
        driver: drivers.find((d) => d.id === dispatch.driver_id),
      })),
    [dispatches, silos, clients, drivers],
  )

  const filteredDispatches = useMemo(() => {
    if (!searchTerm) return dispatchesWithRelations

    return dispatchesWithRelations.filter(
      (dispatch) =>
        dispatch.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.silo?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, dispatchesWithRelations])

  const handleExportExcel = () => {
    const exportData = filteredDispatches.map((dispatch) => ({
      Cliente: dispatch.client?.name || "N/A",
      Conductor: dispatch.driver?.name || "N/A",
      Silo: dispatch.silo?.name || "N/A",
      "Cantidad (m³)": dispatch.quantity_m3,
      REST: dispatch.resistance || "N/A",
      TIPO: dispatch.cement_type || "N/A",
      "ASENT.": dispatch.slump || "N/A",
      Fecha: format(new Date(dispatch.dispatch_date), "dd/MM/yyyy HH:mm", { locale: es }),
      Notas: dispatch.notes || "",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Despachos")

    ws["!cols"] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 30 },
    ]

    XLSX.writeFile(wb, `despachos_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de Despachos</CardTitle>
            <CardDescription>Total: {filteredDispatches.length} despachos</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar despachos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Silo</TableHead>
                <TableHead>Cantidad (m³)</TableHead>
                <TableHead>REST</TableHead>
                <TableHead>TIPO</TableHead>
                <TableHead>ASENT.</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500">
                    No se encontraron despachos
                  </TableCell>
                </TableRow>
              ) : (
                filteredDispatches.map((dispatch) => (
                  <TableRow key={dispatch.id}>
                    <TableCell>{dispatch.client?.name || "N/A"}</TableCell>
                    <TableCell>{dispatch.driver?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dispatch.silo?.name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{dispatch.quantity_m3.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{dispatch.resistance || "-"}</TableCell>
                    <TableCell className="text-sm">{dispatch.cement_type || "-"}</TableCell>
                    <TableCell className="text-sm">{dispatch.slump || "-"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(dispatch.dispatch_date), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
