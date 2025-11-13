-- Insert initial silos (example data for testing)
INSERT INTO silos (name, capacity_m3, current_stock_m3, status) VALUES
  ('Silo A', 100.00, 75.50, 'active'),
  ('Silo B', 150.00, 120.00, 'active'),
  ('Silo C', 100.00, 45.00, 'active'),
  ('Silo D', 200.00, 0.00, 'maintenance');

-- Note: User profiles will be created automatically through the signup process
-- The first admin user should be created manually or through a special signup process
