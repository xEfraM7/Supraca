"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { useData } from "@/lib/data-context"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser } = useData()

  if (!currentUser) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 bg-slate-50">{children}</main>
    </div>
  )
}
