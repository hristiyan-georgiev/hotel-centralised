-- 1. Drop the restrictive policy
DROP POLICY "Users can view their own read status" ON notification_reads;

-- 2. Create a new, inclusive policy
CREATE POLICY "Users can view own status and admins can view all" 
  ON notification_reads
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );