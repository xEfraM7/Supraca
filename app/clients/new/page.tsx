"use client"

import { useData } from "@/lib/data-context"
import { ClientForm } from "@/components/client-form"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewClientPage() {
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
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Nuevo Cliente</h2>
        <p className="text-slate-600 mt-1">Registrar un nuevo cliente</p>
      </div>

      <ClientForm />
    </div>
  )
}
