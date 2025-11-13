"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useMemo } from "react"
import { useData, type Profile } from "@/lib/data-context"
import { Trash2, Search } from "lucide-react"
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

interface ClientsTableProps {
  profile: Profile
}

export function ClientsTable({ profile }: ClientsTableProps) {
  const { clients, deleteClient } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
    setDeleteId(null)
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
                <TableHead>Documento</TableHead>
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
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.document}</TableCell>
                    <TableCell>{client.phone || "N/A"}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.address || "N/A"}</TableCell>
                    {(canManageClients(profile.role) || canDeleteRecords(profile.role)) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canDeleteRecords(profile.role) && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(client.id)}>
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
    </>
  )
}
