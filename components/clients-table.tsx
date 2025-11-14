"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { useData, type Profile, type Client } from "@/lib/data-context"
import { Trash2, Search, Plus, Check, X, Pencil } from "lucide-react"
import { canManageClients, canDeleteRecords } from "@/lib/permissions"
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

interface ClientsTableProps {
  profile: Profile
}

export function ClientsTable({ profile }: ClientsTableProps) {
  const { clients, deleteClient, addClient, updateClient, dispatches, silos, drivers } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [addingAfterRow, setAddingAfterRow] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilter>("all")
  const [historyPageSize, setHistoryPageSize] = useState<PageSize>(10)
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1)
  const [newClient, setNewClient] = useState({
    name: "",
    document: "",
    phone: "",
    email: "",
    address: "",
  })
  const [editData, setEditData] = useState<any>({})

  const clientDispatches = useMemo(() => {
    if (!selectedClient) return []
    
    let filtered = dispatches
      .filter((d) => d.client_id === selectedClient.id)
      .map((dispatch) => ({
        ...dispatch,
        silo: silos.find((s) => s.id === dispatch.silo_id),
        driver: drivers.find((d) => d.id === dispatch.driver_id),
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
  }, [selectedClient, dispatches, silos, drivers, historyDateFilter])

  const paginatedClientDispatches = useMemo(() => {
    const start = (historyCurrentPage - 1) * historyPageSize
    return clientDispatches.slice(start, start + historyPageSize)
  }, [clientDispatches, historyCurrentPage, historyPageSize])

  const historyTotalPages = Math.ceil(clientDispatches.length / historyPageSize)

  const clientTotals = useMemo(() => {
    return clientDispatches.reduce(
      (acc, dispatch) => ({
        m3: acc.m3 + dispatch.quantity_m3,
        kg: acc.kg + dispatch.quantity_kg,
        count: acc.count + 1,
      }),
      { m3: 0, kg: 0, count: 0 }
    )
  }, [clientDispatches])

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm, clients])

  const handleDelete = () => {
    if (!deleteId) return
    deleteClient(deleteId)
    toast.success("Cliente eliminado exitosamente")
    setDeleteId(null)
  }

  const handleAddNew = () => {
    if (!newClient.name || !newClient.document) {
      toast.error("Por favor completa el nombre y cédula de identidad")
      return
    }

    addClient({
      name: newClient.name,
      document: newClient.document,
      phone: newClient.phone || null,
      email: newClient.email || null,
      address: newClient.address || null,
    })

    toast.success("Cliente creado exitosamente")
    setNewClient({ name: "", document: "", phone: "", email: "", address: "" })
    setIsAddingNew(false)
    setAddingAfterRow(null)
  }

  const handleStartAddingAfter = (rowId: string) => {
    setIsAddingNew(true)
    setAddingAfterRow(rowId)
  }

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setHistoryDialogOpen(true)
    setHistoryDateFilter("all")
    setHistoryPageSize(10)
    setHistoryCurrentPage(1)
  }

  const handleEdit = (client: Client) => {
    setEditingId(client.id)
    setEditData({
      name: client.name,
      document: client.document,
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
    })
  }

  const handleSaveEdit = (id: string) => {
    if (!editData.name || !editData.document) {
      toast.error("Por favor completa el nombre y cédula de identidad")
      return
    }

    updateClient(id, {
      name: editData.name,
      document: editData.document,
      phone: editData.phone || null,
      email: editData.email || null,
      address: editData.address || null,
    })

    toast.success("Cliente actualizado exitosamente")
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
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>Total: {filteredClients.length} clientes</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar clientes..."
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
                <TableHead>Cédula de Identidad</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Dirección</TableHead>
                {(canManageClients(profile.role) || canDeleteRecords(profile.role)) && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <>
                    <TableRow key={client.id}>
                      {editingId === client.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(client.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.document}
                              onChange={(e) => setEditData({ ...editData, document: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(client.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.phone}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(client.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.email}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(client.id)}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.address}
                              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(client.id)}
                              className="h-8"
                            />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell 
                            className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => handleClientClick(client)}
                          >
                            {client.name}
                          </TableCell>
                          <TableCell>{client.document}</TableCell>
                          <TableCell>{client.phone || "N/A"}</TableCell>
                          <TableCell>{client.email || "N/A"}</TableCell>
                          <TableCell className="max-w-xs truncate">{client.address || "N/A"}</TableCell>
                        </>
                      )}
                      {(canManageClients(profile.role) || canDeleteRecords(profile.role)) && (
                        <TableCell className="text-right">
                          {editingId === client.id ? (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(client.id)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              {canManageClients(profile.role) && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleStartAddingAfter(client.id)}>
                                    <Plus className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {canDeleteRecords(profile.role) && (
                                <Button variant="ghost" size="sm" onClick={() => setDeleteId(client.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>

                    {isAddingNew && addingAfterRow === client.id && (
                      <TableRow className="bg-green-50 border-l-4 border-green-500">
                        <TableCell>
                          <Input
                            placeholder="Nombre del cliente"
                            value={newClient.name}
                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Cédula de Identidad"
                            value={newClient.document}
                            onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Teléfono"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Correo"
                            value={newClient.email}
                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Dirección"
                            value={newClient.address}
                            onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
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
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
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
              Historial de Despachos - {selectedClient?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Registro completo de todos los despachos realizados
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <>
              <div className="grid grid-cols-3 gap-4 py-4 border-y">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Despachos</p>
                  <p className="text-3xl font-bold text-blue-900">{clientTotals.count}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium mb-1">Total M³</p>
                  <p className="text-3xl font-bold text-green-900">{formatM3(clientTotals.m3)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium mb-1">Total Kg</p>
                  <p className="text-3xl font-bold text-orange-900">{formatKg(clientTotals.kg, 0)}</p>
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
            {clientDispatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium">Sin despachos registrados</p>
                <p className="text-sm">Este cliente aún no tiene despachos en el sistema</p>
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
                    {paginatedClientDispatches.map((dispatch) => {
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

            {clientDispatches.length > 0 && historyTotalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Mostrando <span className="font-semibold text-slate-900">{((historyCurrentPage - 1) * historyPageSize) + 1}</span> a{" "}
                  <span className="font-semibold text-slate-900">{Math.min(historyCurrentPage * historyPageSize, clientDispatches.length)}</span> de{" "}
                  <span className="font-semibold text-slate-900">{clientDispatches.length}</span> registros
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
