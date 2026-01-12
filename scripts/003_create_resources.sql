-- Create resources table for hotel documentation/procedures
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view resources
CREATE POLICY "Users can view all resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert resources
CREATE POLICY "Admins can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update resources
CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete resources
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default resources as examples
INSERT INTO resources (title, content, category) VALUES
  ('Check-In Procedure', 'Standard check-in procedure:

1. Greet the guest warmly
2. Ask for booking confirmation or name
3. Verify ID and payment method
4. Explain hotel amenities and breakfast times
5. Provide key cards and room directions
6. Offer assistance with luggage', 'Front Desk'),
  ('Cancellation Policy', 'Cancellation terms:

- Free cancellation up to 24 hours before check-in
- 50% charge for cancellations within 24 hours
- No refund for no-shows
- Group bookings require 7 days notice

Always direct disputes to management.', 'Policies'),
  ('Emergency Contacts', 'Key contacts:

- Fire Department: 999
- Police: 999
- Ambulance: 999
- Hotel Manager: [Add number]
- Maintenance On-Call: [Add number]
- Security: [Add number]', 'Emergency');
