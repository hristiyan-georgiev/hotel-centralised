import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Building2, 
  ClipboardList, 
  AlertTriangle, 
  MessageSquareWarning, 
  Bell, 
  FileText, 
  Settings,
  ArrowRight,
  TrendingUp,
  Shield
} from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()

  // User stats
  const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: adminCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin")

  // Department stats
  const { count: departmentsCount } = await supabase.from("departments").select("*", { count: "exact", head: true })

  // Handover notes stats
  const today = new Date().toISOString().split("T")[0]
  const { count: todayNotesCount } = await supabase
    .from("handover_notes")
    .select("*", { count: "exact", head: true })
    .eq("note_date", today)

  const { count: urgentNotesCount } = await supabase
    .from("handover_notes")
    .select("*", { count: "exact", head: true })
    .eq("note_date", today)
    .eq("priority", "urgent")

  // Complaints stats
  const { data: complaints } = await supabase.from("complaints").select("id, status, priority")
  const openComplaints = complaints?.filter((c) => c.status === "open").length || 0
  const urgentComplaints = complaints?.filter((c) => c.priority === "urgent" && c.status === "open").length || 0

  // Notifications stats
  const { count: notificationsCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })

  // Resources stats
  const { data: resources } = await supabase.from("resources").select("id, category")
  const resourcesCount = resources?.length || 0
  const categoriesCount = new Set(resources?.map((r) => r.category)).size || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Settings className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">System overview and management</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users" className="h-full">
          <Card className="h-full border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{usersCount || 0}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Total Users</p>
                  {adminCount && adminCount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {adminCount} admin{adminCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/departments" className="h-full">
          <Card className="h-full border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">{departmentsCount || 0}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Departments</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{todayNotesCount || 0}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Notes Today</p>
                
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <ClipboardList className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-600">{openComplaints}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Open Complaints</p>
                {urgentComplaints > 0 && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    {urgentComplaints} urgent
                  </Badge>
                )}
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10">
                <MessageSquareWarning className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/notifications" className="h-full">
          <Card className="h-full border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-indigo-600">{notificationsCount || 0}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Notifications Sent</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <Bell className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/resources" className="h-full">
          <Card className="h-full border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-teal-600">{resourcesCount}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Resources</p>
                  {categoriesCount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'}
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-teal-500/10">
                  <FileText className="h-6 w-6 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full border-slate-500/20 bg-gradient-to-br from-slate-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-slate-600">System</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Admin Access</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Full Control
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/10">
                <Settings className="h-6 w-6 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users" className="h-full">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Manage Users</p>
                      <p className="text-xs text-muted-foreground">Add & edit staff</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/departments" className="h-full">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Departments</p>
                      <p className="text-xs text-muted-foreground">Configure teams</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/notifications" className="h-full">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Notifications</p>
                      <p className="text-xs text-muted-foreground">Broadcast updates</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/resources" className="h-full">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Resources</p>
                      <p className="text-xs text-muted-foreground">Manage guides</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
