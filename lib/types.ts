export interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  department_id: string | null
  role: "admin" | "staff"
  created_at: string
  updated_at: string
  department?: Department
  is_active: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

export interface HandoverNote {
  id: string
  author_id: string
  department_id: string
  category_id: string | null
  title: string
  content: string
  priority: "low" | "normal" | "urgent"
  note_date: string
  created_at: string
  updated_at: string
  author?: Profile
  department?: Department
  category?: Category
}

export interface Resource {
  id: string
  title: string
  content: string
  category: string
  created_by: string | null
  created_at: string
  updated_at: string
  creator?: Profile
}

export interface ComplaintTag {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Complaint {
  id: string
  title: string
  description: string
  guest_name: string | null
  room_number: string | null
  status: "open" | "resolved"
  priority: "low" | "normal" | "urgent"
  created_by: string | null
  assigned_to: string | null
  department_id: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  assignee?: Profile
  resolver?: Profile
  department?: Department
  comments?: ComplaintComment[]
  comment_count?: number
  tags?: ComplaintTag[]
}

export interface ComplaintComment {
  id: string
  complaint_id: string
  author_id: string | null
  content: string
  created_at: string
  author?: Profile
}

export interface Notification {
  id: string
  title: string
  content: string
  priority: "low" | "normal" | "urgent"
  created_by: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  is_read?: boolean
}

export interface NotificationRead {
  id: string
  notification_id: string
  user_id: string
  read_at: string
}

export interface Shift {
  id: string
  staff_id: string | null
  department_id: string | null
  shift_date: string
  start_time: string
  end_time: string
  shift_type: "regular" | "overtime" | "on-call"
  notes: string | null
  acknowledged: boolean
  acknowledged_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  staff?: Profile
  department?: Department
  creator?: Profile
}

export interface ScheduleEvent {
  id: string
  title: string
  description: string | null
  department_id: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  event_type: "meeting" | "training" | "inspection" | "vip" | "other"
  location: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  department?: Department
  creator?: Profile
  attendees?: EventAttendee[]
  user_attendance?: EventAttendee
}

export interface EventAttendee {
  id: string
  event_id: string
  staff_id: string
  acknowledged: boolean
  acknowledged_at: string | null
  staff?: Profile
}

export interface ScheduleTask {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  department_id: string | null
  due_date: string
  due_time: string | null
  priority: "low" | "normal" | "urgent"
  status: "pending" | "in_progress" | "completed"
  acknowledged: boolean
  acknowledged_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
  department?: Department
  creator?: Profile
}

export interface Issue {
  id: string
  title: string
  description: string
  status: "open" | "resolved"
  priority: "low" | "normal" | "urgent"
  resolved_by: string | null
  resolved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  resolver?: Profile
  comments?: IssueComment[]
  comment_count?: number
}

export interface IssueComment {
  id: string
  issue_id: string
  author_id: string | null
  content: string
  created_at: string
  author?: Profile
}
