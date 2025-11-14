"use client"

import type { Profile } from "@/lib/database"
import { SiloInventoryCards } from "@/components/silo-inventory-cards"
import { RecentDispatchesTable } from "@/components/recent-dispatches-table"
import { DashboardCharts } from "@/components/dashboard-charts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart3, Package, TruckIcon, Users, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DashboardContentProps {
  profile: Profile
}

export function DashboardContent({ profile }: DashboardContentProps) {
  const handleClearLocalStorage = () => {
    localStorage.clear()
    toast.success("LocalStorage borrado exitosamente")
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600 mt-1">Vista general de operaciones</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Borrar Datos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción borrará todos los datos almacenados localmente (clientes, conductores, despachos, silos, etc.). 
                Esta acción no se puede deshacer y la página se recargará automáticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearLocalStorage} className="bg-red-600 hover:bg-red-700">
                Borrar Todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <SiloInventoryCards />

      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/clients" className="block">
          <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Clientes</p>
                <p className="text-2xl font-bold text-slate-900">Ver todos</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/drivers" className="block">
          <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <TruckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Conductores</p>
                <p className="text-2xl font-bold text-slate-900">Ver todos</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dispatches" className="block">
          <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Despachos</p>
                <p className="text-2xl font-bold text-slate-900">Gestionar</p>
              </div>
            </div>
          </div>
        </Link>

        {/* <Link href="/reports" className="block">
          <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Reportes</p>
                <p className="text-2xl font-bold text-slate-900">Ver análisis</p>
              </div>
            </div>
          </div>
        </Link> */}
      </div>

      <Tabs defaultValue="dispatches" className="space-y-3">
        <TabsList>
          <TabsTrigger value="dispatches">Despachos Recientes</TabsTrigger>
          <TabsTrigger value="charts">Gráficas</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatches" className="space-y-4">
          <RecentDispatchesTable />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <DashboardCharts />
        </TabsContent>
      </Tabs>
    </div>
  )
}
