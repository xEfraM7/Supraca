"use client"

import { useData } from "@/lib/data-context"
import { DriversTable } from "@/components/drivers-table"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DriversPage() {
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
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Conductores</h2>
        <p className="text-slate-600 mt-1">Gestión de conductores</p>
      </div>

      <DriversTable profile={currentUser} />
    </div>
  )
}
