-- Notifications table for management announcements
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which users have read which notifications
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Notifications: all authenticated users can view, admins can manage
CREATE POLICY "All users can view notifications" ON notifications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete notifications" ON notifications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notification reads: users can manage their own read status
CREATE POLICY "Users can view their own read status" ON notification_reads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read" ON notification_reads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their read status" ON notification_reads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add some example notifications
INSERT INTO notifications (title, content, priority) VALUES
  ('Welcome to Hotel Handover System', 'This is your new staff communication platform. Here you can view handover notes, access resources, and stay updated with management announcements.', 'normal'),
  ('Fire Safety Reminder', 'Please ensure you are familiar with all fire exits and evacuation procedures. Fire drills will be conducted monthly.', 'urgent'),
  ('New Holiday Schedule', 'The updated holiday schedule for 2025 has been posted. Please check with your department manager for your assigned shifts.', 'normal');
