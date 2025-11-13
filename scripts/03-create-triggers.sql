-- Function to update silo stock when cement input is added
CREATE OR REPLACE FUNCTION update_silo_stock_on_input()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE silos
  SET 
    current_stock_m3 = current_stock_m3 + NEW.quantity_m3,
    last_refill_date = NEW.input_date,
    updated_at = NOW()
  WHERE id = NEW.silo_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update silo stock when dispatch is created
CREATE OR REPLACE FUNCTION update_silo_stock_on_dispatch()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE silos
  SET 
    current_stock_m3 = current_stock_m3 - NEW.quantity_m3,
    updated_at = NOW()
  WHERE id = NEW.silo_id;
  
  -- Check if stock goes negative
  IF (SELECT current_stock_m3 FROM silos WHERE id = NEW.silo_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock in silo for dispatch';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic stock updates
CREATE TRIGGER trigger_cement_input_update_stock
  AFTER INSERT ON cement_inputs
  FOR EACH ROW
  EXECUTE FUNCTION update_silo_stock_on_input();

CREATE TRIGGER trigger_dispatch_update_stock
  AFTER INSERT ON dispatches
  FOR EACH ROW
  EXECUTE FUNCTION update_silo_stock_on_dispatch();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_silos_updated_at
  BEFORE UPDATE ON silos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
