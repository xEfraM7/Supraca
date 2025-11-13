export type UserRole = "admin" | "operador" | "supervisor"
export type SiloStatus = "active" | "maintenance" | "inactive"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  tax_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Driver {
  id: string
  name: string
  license_number: string
  phone: string | null
  vehicle_plate: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Silo {
  id: string
  name: string
  capacity_m3: number
  current_stock_m3: number
  status: SiloStatus
  last_refill_date: string | null
  created_at: string
  updated_at: string
}

export interface CementInput {
  id: string
  silo_id: string
  quantity_m3: number
  supplier: string | null
  receipt_number: string | null
  input_date: string
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface Dispatch {
  id: string
  dispatch_number: string
  client_id: string | null
  driver_id: string | null
  silo_id: string | null
  quantity_m3: number
  dispatch_date: string
  delivery_address: string | null
  notes: string | null
  resistance: string | null // REST - Resistencia del cemento
  cement_type: string | null // TIPO - Tipo de cemento
  slump: string | null // ASENT. - Asentamiento del cemento
  created_at: string
  created_by: string | null
}

// Extended types with relations
export interface DispatchWithRelations extends Dispatch {
  clients: Client | null
  drivers: Driver | null
  silos: Silo | null
}
