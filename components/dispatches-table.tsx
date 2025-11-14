"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useState, useMemo } from "react"
import { useData, type Profile } from "@/lib/data-context"
import { Search, Download, Plus, Check, X, Pencil, Trash2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatNumber, formatKg, formatM3 } from "@/lib/format-utils"

// Componente para fila arrastrable
function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="w-8">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  )
}

// Componente para header arrastrable
function SortableHeader({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? '#dbeafe' : undefined,
    zIndex: isDragging ? 50 : undefined,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : undefined,
  }

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors relative group"
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1">{children}</div>
      </div>
    </TableHead>
  )
}

interface DispatchesTableProps {
  profile: Profile
}

type DateFilter = "all" | "today" | "week" | "month" | "year"
type PageSize = 5 | 10 | 15 | 20 | 50 | 999999

export function DispatchesTable({ profile }: DispatchesTableProps) {
  const { dispatches, silos, clients, drivers, addDispatch, updateDispatch, deleteDispatch, resetData } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [addingAfterRow, setAddingAfterRow] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [items, setItems] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "client",
    "driver", 
    "silo",
    "quantity_m3",
    "quantity_kg",
    "resistance",
    "cement_type",
    "slump",
    "date",
  ])
  
  // Estado para nueva fila
  const [newDispatch, setNewDispatch] = useState({
    client_id: "",
    client_name: "",
    driver_id: "",
    driver_name: "",
    silo_id: "",
    quantity_m3: "",
    quantity_kg: "",
    resistance: "",
    cement_type: "",
    slump: "",
  })

  // Estado para edición
  const [editData, setEditData] = useState<any>({})
  
  // Estados para controlar si se está usando texto manual
  const [isManualClient, setIsManualClient] = useState(false)
  const [isManualDriver, setIsManualDriver] = useState(false)
  const [isEditManualClient, setIsEditManualClient] = useState(false)
  const [isEditManualDriver, setIsEditManualDriver] = useState(false)
  
  // Estado para el modal de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dispatchToDelete, setDispatchToDelete] = useState<string | null>(null)

  // Configurar sensores para drag & drop de filas
  const rowSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Configurar sensores para drag & drop de columnas
  const columnSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const filteredByDate = useMemo(() => {
    if (dateFilter === "all") return dispatchesWithRelations

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return dispatchesWithRelations.filter((dispatch) => {
      const dispatchDate = new Date(dispatch.dispatch_date)

      switch (dateFilter) {
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
  }, [dispatchesWithRelations, dateFilter])

  const filteredDispatches = useMemo(() => {
    let filtered = filteredByDate

    if (searchTerm) {
      filtered = filtered.filter(
        (dispatch) =>
          dispatch.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dispatch.driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dispatch.silo?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Ordenamiento
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortColumn) {
          case "client":
            aValue = a.client?.name || ""
            bValue = b.client?.name || ""
            break
          case "driver":
            aValue = a.driver?.name || ""
            bValue = b.driver?.name || ""
            break
          case "silo":
            aValue = a.silo?.name || ""
            bValue = b.silo?.name || ""
            break
          case "quantity_m3":
            aValue = a.quantity_m3
            bValue = b.quantity_m3
            break
          case "quantity_kg":
            aValue = a.quantity_kg
            bValue = b.quantity_kg
            break
          case "date":
            aValue = new Date(a.dispatch_date).getTime()
            bValue = new Date(b.dispatch_date).getTime()
            break
          default:
            return 0
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [searchTerm, filteredByDate, sortColumn, sortDirection])

  const totalPages = Math.ceil(filteredDispatches.length / pageSize)
  const paginatedDispatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const paginated = filteredDispatches.slice(start, start + pageSize)
    
    // Actualizar items para drag & drop
    setItems(paginated.map(d => d.id))
    
    return paginated
  }, [filteredDispatches, currentPage, pageSize])

  // Calcular totales según selección
  const totals = useMemo(() => {
    if (!selectedDriver && !selectedClient) {
      return { m3: 0, kg: 0 }
    }

    let dataToSum = filteredDispatches

    if (selectedDriver) {
      dataToSum = filteredDispatches.filter((d) => d.driver_id === selectedDriver)
    } else if (selectedClient) {
      dataToSum = filteredDispatches.filter((d) => d.client_id === selectedClient)
    }

    return dataToSum.reduce(
      (acc, dispatch) => ({
        m3: acc.m3 + dispatch.quantity_m3,
        kg: acc.kg + dispatch.quantity_kg,
      }),
      { m3: 0, kg: 0 }
    )
  }, [filteredDispatches, selectedDriver, selectedClient])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleDriverClick = (driverId: string) => {
    if (selectedDriver === driverId) {
      setSelectedDriver(null)
    } else {
      setSelectedDriver(driverId)
      setSelectedClient(null)
    }
  }

  const handleClientClick = (clientId: string) => {
    if (selectedClient === clientId) {
      setSelectedClient(null)
    } else {
      setSelectedClient(clientId)
      setSelectedDriver(null)
    }
  }

  const handleExportExcel = () => {
    const exportData = filteredDispatches.map((dispatch) => ({
      Cliente: dispatch.client?.name || "N/A",
      Conductor: dispatch.driver?.name || "N/A",
      Silo: dispatch.silo?.name || "N/A",
      "Cantidad en M³": dispatch.quantity_m3,
      "Cantidad en Kg": dispatch.quantity_kg,
      REST: dispatch.resistance || "N/A",
      TIPO: dispatch.cement_type || "N/A",
      "ASENT.": dispatch.slump || "N/A",
      Fecha: format(new Date(dispatch.dispatch_date), "dd/MM/yyyy HH:mm", { locale: es }),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Despachos")

    ws["!cols"] = [
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
    ]

    XLSX.writeFile(wb, `despachos_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const handleAddNew = () => {
    const hasClient = newDispatch.client_id || newDispatch.client_name
    const hasDriver = newDispatch.driver_id || newDispatch.driver_name
    
    if (!hasClient || !hasDriver || !newDispatch.silo_id || !newDispatch.quantity_m3 || !newDispatch.quantity_kg) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    // Si se usó entrada manual, usar el nombre como ID temporal
    const clientId = newDispatch.client_id || `manual_${newDispatch.client_name}`
    const driverId = newDispatch.driver_id || `manual_${newDispatch.driver_name}`

    addDispatch({
      client_id: clientId,
      driver_id: driverId,
      silo_id: newDispatch.silo_id,
      quantity_m3: Number(newDispatch.quantity_m3),
      quantity_kg: Number(newDispatch.quantity_kg),
      dispatch_date: new Date().toISOString(),
      resistance: newDispatch.resistance || null,
      cement_type: newDispatch.cement_type || null,
      slump: newDispatch.slump || null,
      notes: null,
    })

    toast.success("Despacho creado exitosamente")

    setNewDispatch({
      client_id: "",
      client_name: "",
      driver_id: "",
      driver_name: "",
      silo_id: "",
      quantity_m3: "",
      quantity_kg: "",
      resistance: "",
      cement_type: "",
      slump: "",
    })
    setIsAddingNew(false)
    setAddingAfterRow(null)
    setIsManualClient(false)
    setIsManualDriver(false)
  }

  const handleStartAddingAfter = (rowId: string) => {
    setIsAddingNew(true)
    setAddingAfterRow(rowId)
    setEditingId(null)
  }

  const handleEdit = (dispatch: any) => {
    setEditingId(dispatch.id)
    setEditData({
      client_id: dispatch.client_id,
      client_name: dispatch.client?.name || "",
      driver_id: dispatch.driver_id,
      driver_name: dispatch.driver?.name || "",
      silo_id: dispatch.silo_id,
      quantity_m3: dispatch.quantity_m3,
      quantity_kg: dispatch.quantity_kg,
      resistance: dispatch.resistance || "",
      cement_type: dispatch.cement_type || "",
      slump: dispatch.slump || "",
    })
    setIsEditManualClient(false)
    setIsEditManualDriver(false)
  }

  const handleSaveEdit = (id: string) => {
    // Si se usó entrada manual, usar el nombre como ID temporal
    const clientId = editData.client_id || `manual_${editData.client_name}`
    const driverId = editData.driver_id || `manual_${editData.driver_name}`
    
    updateDispatch(id, {
      client_id: clientId,
      driver_id: driverId,
      silo_id: editData.silo_id,
      quantity_m3: Number(editData.quantity_m3),
      quantity_kg: Number(editData.quantity_kg),
      resistance: editData.resistance || null,
      cement_type: editData.cement_type || null,
      slump: editData.slump || null,
      notes: null,
    })
    toast.success("Despacho actualizado exitosamente")
    setEditingId(null)
    setEditData({})
    setIsEditManualClient(false)
    setIsEditManualDriver(false)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
    setIsEditManualClient(false)
    setIsEditManualDriver(false)
  }

  const handleDelete = (id: string) => {
    setDispatchToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (dispatchToDelete) {
      deleteDispatch(dispatchToDelete)
      toast.success("Despacho eliminado exitosamente")
      setDispatchToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumnOrder((columns) => {
        const oldIndex = columns.indexOf(active.id as string)
        const newIndex = columns.indexOf(over.id as string)
        return arrayMove(columns, oldIndex, newIndex)
      })
    }
  }

  // Función para obtener el contenido de cada columna
  const getColumnContent = (dispatch: any, columnId: string, isEditing: boolean) => {
    if (isEditing) {
      switch (columnId) {
        case "client":
          return (
            <div className="flex gap-1">
              {isEditManualClient ? (
                <>
                  <Input 
                    value={editData.client_name || ""} 
                    onChange={(e) => setEditData({ ...editData, client_name: e.target.value, client_id: "" })} 
                    placeholder="Nombre del cliente"
                    className="h-8 flex-1" 
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditManualClient(false)}
                    className="h-8 px-2"
                    title="Seleccionar de lista"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Select value={editData.client_id} onValueChange={(v) => setEditData({ ...editData, client_id: v, client_name: "" })}>
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditManualClient(true)}
                    className="h-8 px-2"
                    title="Escribir manualmente"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )
        case "driver":
          return (
            <div className="flex gap-1">
              {isEditManualDriver ? (
                <>
                  <Input 
                    value={editData.driver_name || ""} 
                    onChange={(e) => setEditData({ ...editData, driver_name: e.target.value, driver_id: "" })} 
                    placeholder="Nombre del conductor"
                    className="h-8 flex-1" 
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditManualDriver(false)}
                    className="h-8 px-2"
                    title="Seleccionar de lista"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Select value={editData.driver_id} onValueChange={(v) => setEditData({ ...editData, driver_id: v, driver_name: "" })}>
                    <SelectTrigger className="h-8 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditManualDriver(true)}
                    className="h-8 px-2"
                    title="Escribir manualmente"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )
        case "silo":
          return (
            <Select value={editData.silo_id} onValueChange={(v) => setEditData({ ...editData, silo_id: v })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {silos.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        case "quantity_m3":
          return <Input type="number" step="0.01" value={editData.quantity_m3} onChange={(e) => setEditData({ ...editData, quantity_m3: e.target.value })} className="h-8 w-24" />
        case "quantity_kg":
          return <Input type="number" step="0.01" value={editData.quantity_kg} onChange={(e) => setEditData({ ...editData, quantity_kg: e.target.value })} className="h-8 w-24" />
        case "resistance":
          return <Input value={editData.resistance} onChange={(e) => setEditData({ ...editData, resistance: e.target.value })} className="h-8 w-16" />
        case "cement_type":
          return <Input value={editData.cement_type} onChange={(e) => setEditData({ ...editData, cement_type: e.target.value })} className="h-8 w-16" />
        case "slump":
          return <Input value={editData.slump} onChange={(e) => setEditData({ ...editData, slump: e.target.value })} className="h-8 w-16" />
        case "date":
          return <span className="text-sm whitespace-nowrap">{format(new Date(dispatch.dispatch_date), "dd MMM yyyy", { locale: es })}</span>
        default:
          return null
      }
    } else {
      switch (columnId) {
        case "client":
          const clientName = dispatch.client?.name || (dispatch.client_id?.startsWith('manual_') ? dispatch.client_id.replace('manual_', '') : "N/A")
          return (
            <button
              onClick={() => handleClientClick(dispatch.client_id)}
              className={`hover:underline cursor-pointer text-left ${
                selectedClient === dispatch.client_id ? "font-bold text-blue-600" : ""
              }`}
            >
              {clientName}
            </button>
          )
        case "driver":
          const driverName = dispatch.driver?.name || (dispatch.driver_id?.startsWith('manual_') ? dispatch.driver_id.replace('manual_', '') : "N/A")
          return (
            <button
              onClick={() => handleDriverClick(dispatch.driver_id)}
              className={`hover:underline cursor-pointer text-left ${
                selectedDriver === dispatch.driver_id ? "font-bold text-blue-600" : ""
              }`}
            >
              {driverName}
            </button>
          )
        case "silo":
          return <Badge variant="outline">{dispatch.silo?.name || "N/A"}</Badge>
        case "quantity_m3":
          return <span className="font-semibold tabular-nums">{formatM3(dispatch.quantity_m3)}</span>
        case "quantity_kg":
          return <span className="font-semibold tabular-nums">{formatKg(dispatch.quantity_kg, 0)}</span>
        case "resistance":
          return <span className="text-sm">{dispatch.resistance || "-"}</span>
        case "cement_type":
          return <span className="text-sm">{dispatch.cement_type || "-"}</span>
        case "slump":
          return <span className="text-sm">{dispatch.slump || "-"}</span>
        case "date":
          return <span className="text-sm whitespace-nowrap">{format(new Date(dispatch.dispatch_date), "dd MMM yyyy, HH:mm", { locale: es })}</span>
        default:
          return null
      }
    }
  }

  // Función para obtener el header de cada columna
  const getColumnHeader = (columnId: string) => {
    const headers: Record<string, { label: string; sortable: boolean }> = {
      client: { label: "Cliente", sortable: true },
      driver: { label: "Conductor", sortable: true },
      silo: { label: "Silo", sortable: true },
      quantity_m3: { label: "Cantidad en M³", sortable: true },
      quantity_kg: { label: "Cantidad en Kg", sortable: true },
      resistance: { label: "REST", sortable: false },
      cement_type: { label: "TIPO", sortable: false },
      slump: { label: "ASENT.", sortable: false },
      date: { label: "Fecha", sortable: true },
    }
    return headers[columnId]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista de Despachos</CardTitle>
              <CardDescription>Total: {filteredDispatches.length} despachos</CardDescription>
            </div>
            <div className="flex gap-2">
              {/* <Button variant="outline" size="sm" onClick={resetData}>
                Resetear Datos
              </Button> */}
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {(selectedDriver || selectedClient) && (
            <div className="bg-linear-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 text-white rounded-full p-2">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedDriver ? "Total Conductor" : "Total Cliente"}
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      {selectedDriver
                        ? drivers.find((d) => d.id === selectedDriver)?.name
                        : clients.find((c) => c.id === selectedClient)?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-medium">Cantidad en M³</p>
                    <p className="text-2xl font-bold text-blue-900 tabular-nums">{formatM3(totals.m3)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 font-medium">Cantidad en Kg</p>
                    <p className="text-2xl font-bold text-blue-900 tabular-nums">{formatKg(totals.kg, 0)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDriver(null)
                      setSelectedClient(null)
                    }}
                    className="h-9 text-blue-700 hover:text-blue-900 hover:bg-blue-200"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, conductor o silo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Período:</span>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <Button
                    variant={dateFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                    className="h-8"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={dateFilter === "today" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("today")}
                    className="h-8"
                  >
                    Hoy
                  </Button>
                  <Button
                    variant={dateFilter === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("week")}
                    className="h-8"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={dateFilter === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("month")}
                    className="h-8"
                  >
                    Mes
                  </Button>
                  <Button
                    variant={dateFilter === "year" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("year")}
                    className="h-8"
                  >
                    Año
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm font-medium text-slate-600">Mostrar:</span>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  {[5, 10, 15, 20, 50].map((size) => (
                    <Button
                      key={size}
                      variant={pageSize === size ? "default" : "ghost"}
                      size="sm"
                      onClick={() => { setPageSize(size as PageSize); setCurrentPage(1); }}
                      className="h-8 w-10"
                    >
                      {size}
                    </Button>
                  ))}
                  <Button
                    variant={pageSize === 999999 ? "default" : "ghost"}
                    size="sm"
                    onClick={() => { setPageSize(999999 as PageSize); setCurrentPage(1); }}
                    className="h-8 px-3"
                  >
                    Todos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
          <GripVertical className="h-4 w-4" />
          <span className="font-medium">Tip:</span>
          <span>Arrastra las columnas para reordenarlas y las filas usando el icono ⋮⋮</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                    {columnOrder.map((columnId) => {
                      const header = getColumnHeader(columnId)
                      return (
                        <SortableHeader key={columnId} id={columnId}>
                          <div className="flex items-center gap-1">
                            {header.sortable ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSort(columnId)
                                }} 
                                className="h-8 px-2 hover:bg-slate-200"
                              >
                                {header.label}
                                {sortColumn === columnId ? (
                                  sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                                ) : (
                                  <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                                )}
                              </Button>
                            ) : (
                              <span className="text-sm font-medium">{header.label}</span>
                            )}
                          </div>
                        </SortableHeader>
                      )
                    })}
                  </SortableContext>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
            </DndContext>
            <DndContext sensors={rowSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <TableBody>
                {paginatedDispatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-slate-500">
                      No se encontraron despachos
                    </TableCell>
                  </TableRow>
                ) : (
                  <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {items.map((id) => {
                      const dispatch = paginatedDispatches.find(d => d.id === id)
                      if (!dispatch) return null
                      
                      return (
                        <>
                          <SortableRow key={dispatch.id} id={dispatch.id}>
                            {columnOrder.map((columnId) => (
                              <TableCell key={columnId}>
                                {getColumnContent(dispatch, columnId, editingId === dispatch.id)}
                              </TableCell>
                            ))}
                            <TableCell className="text-right">
                              {editingId === dispatch.id ? (
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => handleSaveEdit(dispatch.id)}>
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => handleStartAddingAfter(dispatch.id)}>
                                    <Plus className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(dispatch)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(dispatch.id)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </SortableRow>
                          
                          {isAddingNew && addingAfterRow === dispatch.id && (
                            <TableRow className="bg-green-50 border-l-4 border-green-500">
                              <TableCell></TableCell>
                              {columnOrder.map((columnId) => {
                                switch (columnId) {
                                  case "client":
                                    return (
                                      <TableCell key={columnId}>
                                        <div className="flex gap-1">
                                          {isManualClient ? (
                                            <>
                                              <Input 
                                                value={newDispatch.client_name} 
                                                onChange={(e) => setNewDispatch({ ...newDispatch, client_name: e.target.value, client_id: "" })} 
                                                placeholder="Nombre del cliente"
                                                className="h-8 flex-1" 
                                              />
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setIsManualClient(false)}
                                                className="h-8 px-2"
                                                title="Seleccionar de lista"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Select value={newDispatch.client_id} onValueChange={(v) => setNewDispatch({ ...newDispatch, client_id: v, client_name: "" })}>
                                                <SelectTrigger className="h-8 flex-1">
                                                  <SelectValue placeholder="Cliente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setIsManualClient(true)}
                                                className="h-8 px-2"
                                                title="Escribir manualmente"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </TableCell>
                                    )
                                  case "driver":
                                    return (
                                      <TableCell key={columnId}>
                                        <div className="flex gap-1">
                                          {isManualDriver ? (
                                            <>
                                              <Input 
                                                value={newDispatch.driver_name} 
                                                onChange={(e) => setNewDispatch({ ...newDispatch, driver_name: e.target.value, driver_id: "" })} 
                                                placeholder="Nombre del conductor"
                                                className="h-8 flex-1" 
                                              />
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setIsManualDriver(false)}
                                                className="h-8 px-2"
                                                title="Seleccionar de lista"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Select value={newDispatch.driver_id} onValueChange={(v) => setNewDispatch({ ...newDispatch, driver_id: v, driver_name: "" })}>
                                                <SelectTrigger className="h-8 flex-1">
                                                  <SelectValue placeholder="Conductor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {drivers.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setIsManualDriver(true)}
                                                className="h-8 px-2"
                                                title="Escribir manualmente"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </TableCell>
                                    )
                                  case "silo":
                                    return (
                                      <TableCell key={columnId}>
                                        <Select value={newDispatch.silo_id} onValueChange={(v) => setNewDispatch({ ...newDispatch, silo_id: v })}>
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Silo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {silos.map((s) => (
                                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    )
                                  case "quantity_m3":
                                    return (
                                      <TableCell key={columnId}>
                                        <Input type="number" step="0.01" placeholder="M³" value={newDispatch.quantity_m3} onChange={(e) => setNewDispatch({ ...newDispatch, quantity_m3: e.target.value })} className="h-8 w-24" />
                                      </TableCell>
                                    )
                                  case "quantity_kg":
                                    return (
                                      <TableCell key={columnId}>
                                        <Input type="number" step="0.01" placeholder="Kg" value={newDispatch.quantity_kg} onChange={(e) => setNewDispatch({ ...newDispatch, quantity_kg: e.target.value })} className="h-8 w-24" />
                                      </TableCell>
                                    )
                                  case "resistance":
                                    return (
                                      <TableCell key={columnId}>
                                        <Input placeholder="REST" value={newDispatch.resistance} onChange={(e) => setNewDispatch({ ...newDispatch, resistance: e.target.value })} className="h-8 w-16" />
                                      </TableCell>
                                    )
                                  case "cement_type":
                                    return (
                                      <TableCell key={columnId}>
                                        <Input placeholder="TIPO" value={newDispatch.cement_type} onChange={(e) => setNewDispatch({ ...newDispatch, cement_type: e.target.value })} className="h-8 w-16" />
                                      </TableCell>
                                    )
                                  case "slump":
                                    return (
                                      <TableCell key={columnId}>
                                        <Input placeholder="ASENT" value={newDispatch.slump} onChange={(e) => setNewDispatch({ ...newDispatch, slump: e.target.value })} className="h-8 w-16" />
                                      </TableCell>
                                    )
                                  case "date":
                                    return (
                                      <TableCell key={columnId} className="text-sm whitespace-nowrap">
                                        {format(new Date(), "dd MMM yyyy", { locale: es })}
                                      </TableCell>
                                    )
                                  default:
                                    return <TableCell key={columnId}></TableCell>
                                }
                              })}
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
                      )
                    })}
                  </SortableContext>
                )}
              </TableBody>
            </DndContext>
          </Table>
        </div>

        {filteredDispatches.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
            <div className="text-sm text-slate-600">
              {pageSize === 999999 ? (
                <>
                  Mostrando <span className="font-semibold text-slate-900">todos</span> los{" "}
                  <span className="font-semibold text-slate-900">{filteredDispatches.length}</span> registros
                </>
              ) : (
                <>
                  Mostrando <span className="font-semibold text-slate-900">{((currentPage - 1) * pageSize) + 1}</span> a{" "}
                  <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, filteredDispatches.length)}</span> de{" "}
                  <span className="font-semibold text-slate-900">{filteredDispatches.length}</span> registros
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-9"
                >
                  Primera
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9"
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9"
                >
                  Siguiente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-9"
                >
                  Última
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El despacho será eliminado permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
