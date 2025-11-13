"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { useData, type Profile } from "@/lib/data-context"
import { Trash2, Search } from "lucide-react"
import { canManageDrivers, canDeleteRecords } from "@/lib/permissions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DriversTableProps {
  profile: Profile
}

export function DriversTable({ profile }: DriversTableProps) {
  const { drivers, deleteDriver } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredDrivers = useMemo(() => {
    if (!searchTerm) return drivers

    return drivers.filter(
      (driver) =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.truck_plate?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, drivers])

  const handleDelete = () => {
    if (!deleteId) return
    deleteDriver(deleteId)
    setDeleteId(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Conductores</CardTitle>
              <CardDescription>Total: {filteredDrivers.length} conductores</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar conductores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Licencia</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Placa del Vehículo</TableHead>
                {(canManageDrivers(profile.role) || canDeleteRecords(profile.role)) && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    No se encontraron conductores
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.license}</Badge>
                    </TableCell>
                    <TableCell>{driver.phone || "N/A"}</TableCell>
                    <TableCell>{driver.truck_plate || "N/A"}</TableCell>
                    {(canManageDrivers(profile.role) || canDeleteRecords(profile.role)) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canDeleteRecords(profile.role) && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(driver.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El conductor será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
