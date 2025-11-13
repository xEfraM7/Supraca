"use client"

import { useData } from "@/lib/data-context"
import { DashboardContent } from "@/components/dashboard-content"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
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

  return <DashboardContent profile={currentUser} />
}
