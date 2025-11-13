"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "operador" | "supervisor"

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
  document: string
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
}

export interface Driver {
  id: string
  name: string
  license: string
  phone: string | null
  truck_plate: string | null
  created_at: string
}

export interface Silo {
  id: string
  name: string
  capacity: number
  current_stock: number
  min_stock: number
  created_at: string
}

export interface Dispatch {
  id: string
  silo_id: string
  client_id: string
  driver_id: string
  quantity_m3: number
  dispatch_date: string
  notes: string | null
  resistance: string | null // REST
  cement_type: string | null // TIPO
  slump: string | null // ASENT.
  created_at: string
  silo?: Silo
  client?: Client
  driver?: Driver
}

interface DataContextType {
  currentUser: Profile | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clients: Client[]
  drivers: Driver[]
  silos: Silo[]
  dispatches: Dispatch[]
  addClient: (client: Omit<Client, "id" | "created_at">) => Client
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
  addDriver: (driver: Omit<Driver, "id" | "created_at">) => Driver
  updateDriver: (id: string, driver: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  addDispatch: (dispatch: Omit<Dispatch, "id" | "created_at">) => Dispatch
  updateDispatch: (id: string, dispatch: Partial<Dispatch>) => void
  deleteDispatch: (id: string) => void
  updateSilo: (id: string, silo: Partial<Silo>) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const MOCK_USERS: Profile[] = [
  {
    id: "1",
    email: "admin@planta.com",
    full_name: "Administrador",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "operador@planta.com",
    full_name: "Operador",
    role: "operador",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    email: "supervisor@planta.com",
    full_name: "Supervisor",
    role: "supervisor",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const MOCK_SILOS: Silo[] = [
  {
    id: "1",
    name: "Silo 1",
    capacity: 100,
    current_stock: 75,
    min_stock: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Silo 2",
    capacity: 100,
    current_stock: 45,
    min_stock: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Silo 3",
    capacity: 150,
    current_stock: 120,
    min_stock: 30,
    created_at: new Date().toISOString(),
  }
]

const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Constructora ABC",
    document: "20123456789",
    phone: "+51 999 123 456",
    email: "contacto@abc.com",
    address: "Av. Principal 123",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Inmobiliaria XYZ",
    document: "20987654321",
    phone: "+51 999 654 321",
    email: "ventas@xyz.com",
    address: "Jr. Comercio 456",
    created_at: new Date().toISOString(),
  },
]

const MOCK_DRIVERS: Driver[] = [
  {
    id: "1",
    name: "Juan Pérez",
    license: "Q12345678",
    phone: "+51 999 111 222",
    truck_plate: "ABC-123",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "María García",
    license: "Q87654321",
    phone: "+51 999 333 444",
    truck_plate: "XYZ-789",
    created_at: new Date().toISOString(),
  },
]

const MOCK_DISPATCHES: Dispatch[] = [
  {
    id: "1",
    silo_id: "1",
    client_id: "1",
    driver_id: "1",
    quantity_m3: 10,
    dispatch_date: new Date().toISOString(),
    notes: "Entrega urgente",
    resistance: "210",
    cement_type: "I",
    slump: "4",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    silo_id: "2",
    client_id: "2",
    driver_id: "2",
    quantity_m3: 15,
    dispatch_date: new Date().toISOString(),
    notes: null,
    resistance: "280",
    cement_type: "V",
    slump: "5",
    created_at: new Date().toISOString(),
  },
]

export function DataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS)
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS)
  const [silos, setSilos] = useState<Silo[]>(MOCK_SILOS)
  const [dispatches, setDispatches] = useState<Dispatch[]>(MOCK_DISPATCHES)

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    const savedClients = localStorage.getItem("clients")
    const savedDrivers = localStorage.getItem("drivers")
    const savedSilos = localStorage.getItem("silos")
    const savedDispatches = localStorage.getItem("dispatches")

    if (savedUser) setCurrentUser(JSON.parse(savedUser))
    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedDrivers) setDrivers(JSON.parse(savedDrivers))
    if (savedSilos) setSilos(JSON.parse(savedSilos))
    if (savedDispatches) setDispatches(JSON.parse(savedDispatches))
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
    }
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem("drivers", JSON.stringify(drivers))
  }, [drivers])

  useEffect(() => {
    localStorage.setItem("silos", JSON.stringify(silos))
  }, [silos])

  useEffect(() => {
    localStorage.setItem("dispatches", JSON.stringify(dispatches))
  }, [dispatches])

  const login = async (email: string, _password: string) => {
    const user = MOCK_USERS.find((u) => u.email === email)
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
  }

  const addClient = (client: Omit<Client, "id" | "created_at">) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    setClients([...clients, newClient])
    return newClient
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(clients.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id))
  }

  const addDriver = (driver: Omit<Driver, "id" | "created_at">) => {
    const newDriver: Driver = {
      ...driver,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    setDrivers([...drivers, newDriver])
    return newDriver
  }

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(drivers.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  const deleteDriver = (id: string) => {
    setDrivers(drivers.filter((d) => d.id !== id))
  }

  const addDispatch = (dispatch: Omit<Dispatch, "id" | "created_at">) => {
    setSilos(
      silos.map((s) =>
        s.id === dispatch.silo_id ? { ...s, current_stock: s.current_stock - dispatch.quantity_m3 } : s,
      ),
    )

    const newDispatch: Dispatch = {
      ...dispatch,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }
    setDispatches([...dispatches, newDispatch])
    return newDispatch
  }

  const updateDispatch = (id: string, updates: Partial<Dispatch>) => {
    const oldDispatch = dispatches.find((d) => d.id === id)
    if (oldDispatch && updates.quantity_m3 !== undefined) {
      const diff = updates.quantity_m3 - oldDispatch.quantity_m3
      setSilos(silos.map((s) => (s.id === oldDispatch.silo_id ? { ...s, current_stock: s.current_stock - diff } : s)))
    }
    setDispatches(dispatches.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  const deleteDispatch = (id: string) => {
    const dispatch = dispatches.find((d) => d.id === id)
    if (dispatch) {
      setSilos(
        silos.map((s) =>
          s.id === dispatch.silo_id ? { ...s, current_stock: s.current_stock + dispatch.quantity_m3 } : s,
        ),
      )
    }
    setDispatches(dispatches.filter((d) => d.id !== id))
  }

  const updateSilo = (id: string, updates: Partial<Silo>) => {
    setSilos(silos.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  return (
    <DataContext.Provider
      value={{
        currentUser,
        login,
        logout,
        clients,
        drivers,
        silos,
        dispatches,
        addClient,
        updateClient,
        deleteClient,
        addDriver,
        updateDriver,
        deleteDriver,
        addDispatch,
        updateDispatch,
        deleteDispatch,
        updateSilo,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
