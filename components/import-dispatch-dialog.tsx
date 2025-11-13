"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Upload, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"
import { createClient } from "@/lib/client"

interface ImportDispatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
  userId: string
}

interface ImportRow {
  "N° Despacho": string
  Cliente: string
  Conductor: string
  Silo: string
  "Cantidad (m³)": number
  Fecha: string
  "Dirección de Entrega"?: string
  Notas?: string
}

export function ImportDispatchDialog({ open, onOpenChange, onImportComplete, userId }: ImportDispatchDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [importCount, setImportCount] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo Excel")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData: ImportRow[] = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        throw new Error("El archivo Excel está vacío")
      }

      const supabase = createClient()

      // Get all clients, drivers, and silos for matching
      const [clientsRes, driversRes, silosRes] = await Promise.all([
        supabase.from("clients").select("id, name"),
        supabase.from("drivers").select("id, name"),
        supabase.from("silos").select("id, name"),
      ])

      const clients = clientsRes.data || []
      const drivers = driversRes.data || []
      const silos = silosRes.data || []

      const dispatches = []

      for (const row of jsonData) {
        // Validate required fields
        if (!row["N° Despacho"] || !row["Cliente"] || !row["Conductor"] || !row["Silo"] || !row["Cantidad (m³)"]) {
          continue // Skip invalid rows
        }

        // Find matching records
        const client = clients.find((c) => c.name.toLowerCase() === row["Cliente"].toLowerCase())
        const driver = drivers.find((d) => d.name.toLowerCase() === row["Conductor"].toLowerCase())
        const silo = silos.find((s) => s.name.toLowerCase() === row["Silo"].toLowerCase())

        if (!client || !driver || !silo) {
          console.error("[v0] Missing reference for row:", row)
          continue // Skip if references not found
        }

        dispatches.push({
          dispatch_number: row["N° Despacho"],
          client_id: client.id,
          driver_id: driver.id,
          silo_id: silo.id,
          quantity_m3: Number(row["Cantidad (m³)"]),
          dispatch_date: row["Fecha"] ? new Date(row["Fecha"]).toISOString() : new Date().toISOString(),
          delivery_address: row["Dirección de Entrega"] || null,
          notes: row["Notas"] || null,
          created_by: userId,
        })
      }

      if (dispatches.length === 0) {
        throw new Error("No se encontraron registros válidos para importar")
      }

      // Insert dispatches
      const { error: insertError } = await supabase.from("dispatches").insert(dispatches)

      if (insertError) throw insertError

      setImportCount(dispatches.length)
      setSuccess(true)
      setTimeout(() => {
        onImportComplete()
        onOpenChange(false)
        resetDialog()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar el archivo")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    setImportCount(0)
  }

  const handleDownloadTemplate = () => {
    const template = [
      {
        "N° Despacho": "DESP-001",
        Cliente: "Ejemplo Cliente",
        Conductor: "Juan Pérez",
        Silo: "Silo A",
        "Cantidad (m³)": 50.0,
        Fecha: "2024-01-15",
        "Dirección de Entrega": "Calle Principal 123",
        Notas: "Entrega urgente",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    XLSX.writeFile(wb, "plantilla_despachos.xlsx")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Despachos desde Excel</DialogTitle>
          <DialogDescription>Sube un archivo Excel con los despachos a importar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Importación exitosa! Se importaron {importCount} despachos.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate} className="w-full bg-transparent">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Descargar Plantilla Excel
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-600">
                        {file ? file.name : "Haz clic para seleccionar un archivo Excel"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Asegúrate de que los clientes, conductores y silos existan en el sistema antes de importar.
                </AlertDescription>
              </Alert>

              <Button onClick={handleImport} disabled={!file || isProcessing} className="w-full">
                {isProcessing ? "Importando..." : "Importar Despachos"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
