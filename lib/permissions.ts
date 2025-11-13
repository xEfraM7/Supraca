import type { UserRole } from "@/lib/database"

export function canManageClients(role: UserRole): boolean {
  return role === "admin" || role === "supervisor"
}

export function canManageDrivers(role: UserRole): boolean {
  return role === "admin" || role === "supervisor"
}

export function canManageSilos(role: UserRole): boolean {
  return role === "admin"
}

export function canCreateDispatch(role: UserRole): boolean {
  return role === "admin" || role === "operador" || role === "supervisor"
}

export function canCreateCementInput(role: UserRole): boolean {
  return role === "admin" || role === "operador" || role === "supervisor"
}

export function canDeleteRecords(role: UserRole): boolean {
  return role === "admin"
}

export function canEditRecords(role: UserRole): boolean {
  return role === "admin"
}

export function canViewReports(role: UserRole): boolean {
  return true // All authenticated users can view reports
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operador: "Operador",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Control total del sistema, gestión de usuarios y configuración",
  supervisor: "Gestión de clientes, conductores y supervisión de operaciones",
  operador: "Registro de despachos e ingresos de cemento",
}
