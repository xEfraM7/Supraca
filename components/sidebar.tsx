"use client"

import { useData } from "@/lib/data-context"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, TruckIcon, Package, BarChart3, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Conductores", href: "/drivers", icon: TruckIcon },
  { name: "Despachos", href: "/dispatches", icon: Package },
]

export function Sidebar() {
  const { currentUser, logout } = useData()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!currentUser) return null

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center border-b border-slate-800 px-6">
            <h1 className="text-xl font-bold">Planta de Concreto</h1>
          </div>

          {/* User info */}
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                {currentUser.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.full_name || "Usuario"}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-800 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  )
}
