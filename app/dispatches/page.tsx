"use client"

import { useData } from "@/lib/data-context"
import { DispatchesTable } from "@/components/dispatches-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DispatchesPage() {
  const { currentUser } = useData()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
    }
  }, [currentUser, router])

  if (!currentUser) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Despachos</h2>
          <p className="text-slate-600 mt-1">Gestión de despachos de cemento</p>
        </div>
        <Link href="/dispatches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Despacho
          </Button>
        </Link>
      </div>

      <DispatchesTable profile={currentUser} />
    </div>
  )
}
