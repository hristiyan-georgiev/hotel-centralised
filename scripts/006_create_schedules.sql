-- Hotel Handover System - Schedule Tables
-- Run this after the previous migration scripts

-- Shifts table for staff scheduling
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_type VARCHAR(50) DEFAULT 'regular', -- regular, overtime, on-call
  notes TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table for department/hotel-wide events
CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE, -- NULL means hotel-wide
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type VARCHAR(50) DEFAULT 'meeting', -- meeting, training, inspection, vip, other
  location VARCHAR(255),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event attendees for tracking acknowledgment
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  UNIQUE(event_id, staff_id)
);

-- Tasks table for assigned duties
CREATE TABLE IF NOT EXISTS schedule_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  due_time TIME,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_tasks ENABLE ROW LEVEL SECURITY;

-- Shifts policies
CREATE POLICY "Staff can view shifts in their department" ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.department_id = shifts.department_id OR shifts.staff_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage shifts" ON shifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Staff can acknowledge own shifts" ON shifts
  FOR UPDATE USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

-- Schedule events policies
CREATE POLICY "All staff can view events" ON schedule_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admins can manage events" ON schedule_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Event attendees policies
CREATE POLICY "Staff can view own attendance" ON event_attendees
  FOR SELECT USING (
    staff_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can manage attendees" ON event_attendees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Staff can acknowledge own attendance" ON event_attendees
  FOR UPDATE USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

-- Schedule tasks policies
CREATE POLICY "Staff can view own or department tasks" ON schedule_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.department_id = schedule_tasks.department_id)
    )
  );

CREATE POLICY "Admins can manage tasks" ON schedule_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Staff can update own tasks" ON schedule_tasks
  FOR UPDATE USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_staff ON shifts(staff_id);
CREATE INDEX IF NOT EXISTS idx_shifts_department ON shifts(department_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_department ON schedule_events(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON schedule_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON schedule_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON schedule_tasks(department_id);
