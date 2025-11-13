-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'operador', 'supervisor');
CREATE TYPE silo_status AS ENUM ('active', 'maintenance', 'inactive');

-- Users profile table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operador',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  vehicle_plate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Silos table (cement storage)
CREATE TABLE silos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity_m3 DECIMAL(10, 2) NOT NULL,
  current_stock_m3 DECIMAL(10, 2) DEFAULT 0 CHECK (current_stock_m3 >= 0),
  status silo_status DEFAULT 'active',
  last_refill_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MP AGRO - Raw material input (cement input)
CREATE TABLE cement_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  silo_id UUID REFERENCES silos(id) ON DELETE CASCADE,
  quantity_m3 DECIMAL(10, 2) NOT NULL CHECK (quantity_m3 > 0),
  supplier TEXT,
  receipt_number TEXT,
  input_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- RELACION DE DESPACHO - Dispatch records (cement output)
CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  silo_id UUID REFERENCES silos(id) ON DELETE SET NULL,
  quantity_m3 DECIMAL(10, 2) NOT NULL CHECK (quantity_m3 > 0),
  dispatch_date TIMESTAMPTZ DEFAULT NOW(),
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_drivers_license ON drivers(license_number);
CREATE INDEX idx_silos_status ON silos(status);
CREATE INDEX idx_cement_inputs_date ON cement_inputs(input_date);
CREATE INDEX idx_cement_inputs_silo ON cement_inputs(silo_id);
CREATE INDEX idx_dispatches_date ON dispatches(dispatch_date);
CREATE INDEX idx_dispatches_client ON dispatches(client_id);
CREATE INDEX idx_dispatches_driver ON dispatches(driver_id);
CREATE INDEX idx_dispatches_silo ON dispatches(silo_id);
CREATE INDEX idx_dispatches_number ON dispatches(dispatch_number);
