"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { useData, type Profile, type Driver } from "@/lib/data-context"
import { Trash2, Search, Plus, Check, X, Pencil } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { formatKg, formatM3 } from "@/lib/format-utils"

type DateFilter = "all" | "today" | "week" | "month" | "year"
type PageSize = 10 | 20 | 50 | 100

interface DriversTableProps {
  profile: Profile
}

export function DriversTable({ profile }: DriversTableProps) {
  const { drivers, deleteDriver, addDriver, updateDriver, dispatches, silos, clients } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [addingAfterRow, setAddingAfterRow] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilter>("all")
  const [historyPageSize, setHistoryPageSize] = useState<PageSize>(10)
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
  const [newDriver, setNewDriver] = useState({
    name: "",
    license: "",
    phone: "",
    truck_plate: "",
  })
  const [editData, setEditData] = useState<any>({})

  const driverDispatches = useMemo(() => {
    if (!selectedDriver) return []
    
    let filtered = dispatches
      .filter((d) => d.driver_id === selectedDriver.id)
      .map((dispatch) => ({
        ...dispatch,
        silo: silos.find((s) => s.id === dispatch.silo_id),
        client: clients.find((c) => c.id === dispatch.client_id),
      }))

    // Filtrar por fecha
    if (historyDateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((dispatch) => {
        const dispatchDate = new Date(dispatch.dispatch_date)

        switch (historyDateFilter) {
          case "today":
            return dispatchDate >= today
          case "week":
            return isWithinInterval(dispatchDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) })
          case "month":
            return isWithinInterval(dispatchDate, { start: startOfMonth(now), end: endOfMonth(now) })
          case "year":
            return isWithinInterval(dispatchDate, { start: startOfYear(now), end: endOfYear(now) })
          default:
            return true
        }
      })
    }

    return filtered.sort((a, b) => new Date(b.dispatch_date).getTime() - new Date(a.dispatch_date).getTime())
  }, [selectedDriver, dispatches, silos, clients, historyDateFilter])

  const paginatedDriverDispatches = useMemo(() => {
    const start = (historyCurrentPage - 1) * historyPageSize
    return driverDispatches.slice(start, start + historyPageSize)
  }, [driverDispatches, historyCurrentPage, historyPageSize])

  const historyTotalPages = Math.ceil(driverDispatches.length / historyPageSize)

  const driverTotals = useMemo(() => {
    return driverDispatches.reduce(
      (acc, dispatch) => ({
        m3: acc.m3 + dispatch.quantity_m3,
        kg: acc.kg + dispatch.quantity_kg,
        count: acc.count + 1,
      }),
      { m3: 0, kg: 0, count: 0 }
    )
  }, [driverDispatches])

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
    toast.success("Conductor eliminado exitosamente")
    setDeleteId(null)
  }

  const handleAddNew = () => {
    if (!newDriver.name || !newDriver.license) {
      toast.error("Por favor completa el nombre y licencia")
      return
    }

    addDriver({
      name: newDriver.name,
      license: newDriver.license,
      phone: newDriver.phone || null,
      truck_plate: newDriver.truck_plate || null,
    })

    toast.success("Conductor creado exitosamente")
    setNewDriver({ name: "", license: "", phone: "", truck_plate: "" })
    setIsAddingNew(false)
    setAddingAfterRow(null)
  }

  const handleStartAddingAfter = (rowId: string) => {
    setIsAddingNew(true)
    setAddingAfterRow(rowId)
  }

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver)
    setHistoryDialogOpen(true)
    setHistoryDateFilter("all")
    setHistoryPageSize(10)
    setHistoryCurrentPage(1)
  }

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id)
    setEditData({
      name: driver.name,
      license: driver.license,
      phone: driver.phone || "",
      truck_plate: driver.truck_plate || "",
    })
  }

  const handleSaveEdit = (id: string) => {
    if (!editData.name || !editData.license) {
      toast.error("Por favor completa el nombre y licencia")
      return
    }

    updateDriver(id, {
      name: editData.name,
      license: editData.license,
      phone: editData.phone || null,
      truck_plate: editData.truck_plate || null,
    })

    toast.success("Conductor actualizado exitosamente")
    setEditingId(null)
    setEditData({})
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
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
                  <>
                    <TableRow key={driver.id}>
                      {editingId === driver.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(driver.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.license}
                              onChange={(e) => setEditData({ ...editData, license: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(driver.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.phone}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(driver.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.truck_plate}
                              onChange={(e) => setEditData({ ...editData, truck_plate: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(driver.id)}
                              className="h-8"
                            />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell 
                            className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => handleDriverClick(driver)}
                          >
                            {driver.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{driver.license}</Badge>
                          </TableCell>
                          <TableCell>{driver.phone || "N/A"}</TableCell>
                          <TableCell>{driver.truck_plate || "N/A"}</TableCell>
                        </>
                      )}
                      {(canManageDrivers(profile.role) || canDeleteRecords(profile.role)) && (
                        <TableCell className="text-right">
                          {editingId === driver.id ? (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(driver.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              {canManageDrivers(profile.role) && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleStartAddingAfter(driver.id)}>
                                    <Plus className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(driver)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {canDeleteRecords(profile.role) && (
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(driver.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>

                    {isAddingNew && addingAfterRow === driver.id && (
                      <TableRow className="bg-green-50 border-l-4 border-green-500">
                        <TableCell>
                          <Input
                            placeholder="Nombre del conductor"
                            value={newDriver.name}
                            onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Licencia"
                            value={newDriver.license}
                            onChange={(e) => setNewDriver({ ...newDriver, license: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Teléfono"
                            value={newDriver.phone}
                            onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Placa"
                            value={newDriver.truck_plate}
                            onChange={(e) => setNewDriver({ ...newDriver, truck_plate: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={handleAddNew}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setIsAddingNew(false); setAddingAfterRow(null); }}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-none max-h-[98vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Historial de Despachos - {selectedDriver?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Registro completo de todos los despachos realizados
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <>
              <div className="grid grid-cols-3 gap-4 py-4 border-y">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Despachos</p>
                  <p className="text-3xl font-bold text-blue-900">{driverTotals.count}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">Total M³</p>
                  <p className="text-3xl font-bold text-green-900">{formatM3(driverTotals.m3)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium mb-1">Total Kg</p>
                  <p className="text-3xl font-bold text-orange-900">{formatKg(driverTotals.kg, 0)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center py-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Período:</span>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={historyDateFilter === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setHistoryDateFilter("all"); setHistoryCurrentPage(1); }}
                      className="h-8"
                    >
                      Todos
                    </Button>
                    <Button
                      variant={historyDateFilter === "today" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setHistoryDateFilter("today"); setHistoryCurrentPage(1); }}
                      className="h-8"
                    >
                      Hoy
                    </Button>
                    <Button
                      variant={historyDateFilter === "week" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setHistoryDateFilter("week"); setHistoryCurrentPage(1); }}
                      className="h-8"
                    >
                      Semana
                    </Button>
                    <Button
                      variant={historyDateFilter === "month" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setHistoryDateFilter("month"); setHistoryCurrentPage(1); }}
                      className="h-8"
                    >
                      Mes
                    </Button>
                    <Button
                      variant={historyDateFilter === "year" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setHistoryDateFilter("year"); setHistoryCurrentPage(1); }}
                      className="h-8"
                    >
                      Año
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm font-medium text-slate-600">Mostrar:</span>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {[10, 20, 50, 100].map((size) => (
                      <Button
                        key={size}
                        variant={historyPageSize === size ? "default" : "ghost"}
                        size="sm"
                        onClick={() => { setHistoryPageSize(size as PageSize); setHistoryCurrentPage(1); }}
                        className="h-8 w-10"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex-1 overflow-y-auto">
            {driverDispatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium">Sin despachos registrados</p>
                <p className="text-sm">Este conductor aún no tiene despachos en el sistema</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Silo</TableHead>
                      <TableHead className="text-right">Cantidad M³</TableHead>
                      <TableHead className="text-right">Cantidad Kg</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDriverDispatches.map((dispatch) => {
                      return (
                        <TableRow key={dispatch.id} className="hover:bg-slate-50">
                          <TableCell>
                            <Badge variant="outline">{dispatch.silo?.name || "N/A"}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums text-right">{formatM3(dispatch.quantity_m3)}</TableCell>
                          <TableCell className="font-semibold tabular-nums text-right">{formatKg(dispatch.quantity_kg, 0)}</TableCell>
                          <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                            {format(new Date(dispatch.dispatch_date), "dd MMM yyyy, HH:mm", { locale: es })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {driverDispatches.length > 0 && historyTotalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Mostrando <span className="font-semibold text-slate-900">{((historyCurrentPage - 1) * historyPageSize) + 1}</span> a{" "}
                  <span className="font-semibold text-slate-900">{Math.min(historyCurrentPage * historyPageSize, driverDispatches.length)}</span> de{" "}
                  <span className="font-semibold text-slate-900">{driverDispatches.length}</span> registros
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryCurrentPage(1)}
                    disabled={historyCurrentPage === 1}
                    className="h-9"
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={historyCurrentPage === 1}
                    className="h-9"
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => {
                      let pageNum: number
                      if (historyTotalPages <= 5) {
                        pageNum = i + 1
                      } else if (historyCurrentPage <= 3) {
                        pageNum = i + 1
                      } else if (historyCurrentPage >= historyTotalPages - 2) {
                        pageNum = historyTotalPages - 4 + i
                      } else {
                        pageNum = historyCurrentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={historyCurrentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setHistoryCurrentPage(pageNum)}
                          className="h-9 w-9"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryCurrentPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyCurrentPage === historyTotalPages}
                    className="h-9"
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryCurrentPage(historyTotalPages)}
                    disabled={historyCurrentPage === historyTotalPages}
                    className="h-9"
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
