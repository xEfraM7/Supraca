-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE silos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cement_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clients policies (all authenticated users can read, admins and supervisors can modify)
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and supervisors can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drivers policies (all authenticated users can read, admins and supervisors can modify)
CREATE POLICY "Authenticated users can view drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and supervisors can insert drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins and supervisors can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Admins can delete drivers"
  ON drivers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Silos policies (all authenticated users can read, only admins can modify)
CREATE POLICY "Authenticated users can view silos"
  ON silos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert silos"
  ON silos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update silos"
  ON silos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete silos"
  ON silos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cement inputs policies (all authenticated users can read, admins and operators can create)
CREATE POLICY "Authenticated users can view cement inputs"
  ON cement_inputs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can insert cement inputs"
  ON cement_inputs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'operador', 'supervisor')
    )
  );

CREATE POLICY "Admins can update cement inputs"
  ON cement_inputs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete cement inputs"
  ON cement_inputs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Dispatches policies (all authenticated users can read, admins and operators can create)
CREATE POLICY "Authenticated users can view dispatches"
  ON dispatches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and operators can insert dispatches"
  ON dispatches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'operador', 'supervisor')
    )
  );

CREATE POLICY "Admins can update dispatches"
  ON dispatches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete dispatches"
  ON dispatches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
