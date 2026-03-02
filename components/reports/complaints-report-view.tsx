"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  FileSpreadsheet,
  FileText,
  Clock,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, differenceInHours } from "date-fns"
import type { Complaint, Department, Profile, ComplaintTag } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ComplaintsChart } from "./complaints-chart"
import { PriorityChart } from "./priority-chart"
import { DepartmentChart } from "./department-chart"
import { ResolutionTimeChart } from "./resolution-time-chart"
import { TagsChart } from "./tags-chart"

interface ComplaintsReportViewProps {
  complaints: Complaint[]
  departments: Department[]
  availableTags: ComplaintTag[]
  profile: Profile
}

type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export function ComplaintsReportView({ complaints, departments, availableTags, profile }: ComplaintsReportViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Filter complaints based on selected criteria
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const complaintDate = new Date(complaint.created_at)

      // Date range filter
      if (dateRange.from && dateRange.to) {
        if (!isWithinInterval(complaintDate, { start: dateRange.from, end: dateRange.to })) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && complaint.status !== statusFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== "all" && complaint.priority !== priorityFilter) {
        return false
      }

      // Department filter
      if (departmentFilter !== "all" && complaint.department_id !== departmentFilter) {
        return false
      }

      return true
    })
  }, [complaints, dateRange, statusFilter, priorityFilter, departmentFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredComplaints.length
    const open = filteredComplaints.filter((c) => c.status === "open").length
    const resolved = filteredComplaints.filter((c) => c.status === "resolved").length
    const urgent = filteredComplaints.filter((c) => c.priority === "urgent").length

    // Calculate average resolution time for resolved complaints
    const resolvedComplaints = filteredComplaints.filter((c) => c.status === "resolved" && c.resolved_at)
    const totalResolutionHours = resolvedComplaints.reduce((acc, c) => {
      const created = new Date(c.created_at)
      const resolved = new Date(c.resolved_at!)
      return acc + differenceInHours(resolved, created)
    }, 0)
    const avgResolutionTime =
      resolvedComplaints.length > 0 ? Math.round(totalResolutionHours / resolvedComplaints.length) : 0

    // Calculate resolution rate
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    return { total, open, resolved, urgent, avgResolutionTime, resolutionRate }
  }, [filteredComplaints])

  // Generate data for charts
  const chartData = useMemo(() => {
    // Group complaints by date
    const byDate: Record<string, { date: string; total: number; resolved: number; open: number }> = {}

    filteredComplaints.forEach((c) => {
      const date = format(new Date(c.created_at), "MMM dd")
      if (!byDate[date]) {
        byDate[date] = { date, total: 0, resolved: 0, open: 0 }
      }
      byDate[date].total++
      if (c.status === "resolved") {
        byDate[date].resolved++
      } else {
        byDate[date].open++
      }
    })

    const timelineData = Object.values(byDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Priority breakdown
    const priorityData = [
      {
        name: "Urgent",
        value: filteredComplaints.filter((c) => c.priority === "urgent").length,
        fill: "hsl(var(--urgent))",
      },
      {
        name: "Normal",
        value: filteredComplaints.filter((c) => c.priority === "normal").length,
        fill: "hsl(var(--normal))",
      },
      { name: "Low", value: filteredComplaints.filter((c) => c.priority === "low").length, fill: "hsl(var(--low))" },
    ].filter((d) => d.value > 0)

    // Department breakdown
    const deptCounts: Record<string, number> = {}
    filteredComplaints.forEach((c) => {
      const deptName = c.department?.name || "Unassigned"
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1
    })
    const departmentData = Object.entries(deptCounts).map(([name, value]) => ({ name, value }))

    // Resolution time distribution
    const resolvedComplaints = filteredComplaints.filter((c) => c.status === "resolved" && c.resolved_at)
    const resolutionBuckets = {
      "< 1 hour": 0,
      "1-4 hours": 0,
      "4-24 hours": 0,
      "1-3 days": 0,
      "> 3 days": 0,
    }
    resolvedComplaints.forEach((c) => {
      const hours = differenceInHours(new Date(c.resolved_at!), new Date(c.created_at))
      if (hours < 1) resolutionBuckets["< 1 hour"]++
      else if (hours < 4) resolutionBuckets["1-4 hours"]++
      else if (hours < 24) resolutionBuckets["4-24 hours"]++
      else if (hours < 72) resolutionBuckets["1-3 days"]++
      else resolutionBuckets["> 3 days"]++
    })
    const resolutionTimeData = Object.entries(resolutionBuckets).map(([name, value]) => ({ name, value }))

    // Tag breakdown
    const tagCounts: Record<string, { count: number; color: string }> = {}
    filteredComplaints.forEach((c) => {
      if (c.tags && c.tags.length > 0) {
        c.tags.forEach((tag) => {
          if (!tagCounts[tag.name]) {
            tagCounts[tag.name] = { count: 0, color: tag.color }
          }
          tagCounts[tag.name].count++
        })
      }
    })
    const tagsData = Object.entries(tagCounts)
      .map(([name, data]) => ({ name, value: data.count, color: data.color }))
      .sort((a, b) => b.value - a.value)

    return { timelineData, priorityData, departmentData, resolutionTimeData, tagsData }
  }, [filteredComplaints])

  // Export functions
  const exportToCSV = () => {
    const headers = [
      "Title",
      "Description",
      "Status",
      "Priority",
      "Department",
      "Guest Name",
      "Room",
      "Created At",
      "Resolved At",
    ]
    const rows = filteredComplaints.map((c) => [
      c.title,
      c.description,
      c.status,
      c.priority,
      c.department?.name || "Unassigned",
      c.guest_name || "",
      c.room_number || "",
      format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
      c.resolved_at ? format(new Date(c.resolved_at), "yyyy-MM-dd HH:mm") : "",
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `complaints-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  const exportToPDF = () => {
    // Create a printable HTML document
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complaints Report - ${format(new Date(), "yyyy-MM-dd")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1a365d; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-box { padding: 15px; background: #f7fafc; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-label { color: #718096; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background: #f7fafc; }
            .priority-urgent { color: #e53e3e; }
            .priority-normal { color: #d69e2e; }
            .priority-low { color: #38a169; }
            .status-open { color: #e53e3e; }
            .status-resolved { color: #38a169; }
          </style>
        </head>
        <body>
          <h1>Complaints Report</h1>
          <p>Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</p>
          <p>Date Range: ${dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "All"} - ${dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "All"}</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${stats.total}</div>
              <div class="stat-label">Total Complaints</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.resolved}</div>
              <div class="stat-label">Resolved</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.resolutionRate}%</div>
              <div class="stat-label">Resolution Rate</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.avgResolutionTime}h</div>
              <div class="stat-label">Avg Resolution Time</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Guest</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${filteredComplaints
                .map(
                  (c) => `
                <tr>
                  <td>${c.title}</td>
                  <td class="status-${c.status}">${c.status}</td>
                  <td class="priority-${c.priority}">${c.priority}</td>
                  <td>${c.department?.name || "Unassigned"}</td>
                  <td>${c.guest_name || "-"}</td>
                  <td>${format(new Date(c.created_at), "MMM dd, yyyy")}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Filters</CardTitle>
          <CardDescription>Customise your report by selecting filters below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2 lg:col-span-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal cursor-pointer bg-white",
                      !dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="[&_button]:cursor-pointer"
                  />
                  <div className="flex gap-2 p-3 border-t">
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
                    >
                      This month
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all">All Statuses</SelectItem>
                  <SelectItem className="cursor-pointer" value="open">Open</SelectItem>
                  <SelectItem className="cursor-pointer" value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all">All Priorities</SelectItem>
                  <SelectItem className="cursor-pointer" value="urgent">Urgent</SelectItem>
                  <SelectItem className="cursor-pointer" value="normal">Normal</SelectItem>
                  <SelectItem className="cursor-pointer" value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="cursor-pointer" value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem className="cursor-pointer" key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.resolutionRate}%</p>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </div>
              <div
                className={cn("p-3 rounded-full", stats.resolutionRate >= 70 ? "bg-green-500/10" : "bg-orange-500/10")}
              >
                {stats.resolutionRate >= 70 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats.avgResolutionTime}h</p>
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-destructive">{stats.urgent}</p>
                <p className="text-sm text-muted-foreground">Urgent Issues</p>
              </div>
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="timeline" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="priority" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Priority</span>
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Department</span>
            </TabsTrigger>
            <TabsTrigger value="resolution" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Resolution</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2 cursor-pointer data-[state=inactive]:hover:bg-white/40">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button className="cursor-pointer bg-white" variant="outline" size="sm" onClick={exportToCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button className="cursor-pointer bg-white" variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Complaints Over Time</CardTitle>
              <CardDescription>
                Track the frequency and resolution of complaints over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComplaintsChart data={chartData.timelineData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority">
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>Breakdown of complaints by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              <PriorityChart data={chartData.priorityData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Department</CardTitle>
              <CardDescription>See which departments receive the most complaints</CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentChart data={chartData.departmentData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolution">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Distribution</CardTitle>
              <CardDescription>How quickly complaints are being resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <ResolutionTimeChart data={chartData.resolutionTimeData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Complaints by Type</CardTitle>
              <CardDescription>Distribution of complaints across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <TagsChart data={chartData.tagsData} />

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Complaints</CardTitle>
          <CardDescription>
            Showing {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? "s" : ""} matching your
            filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Department</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Priority</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Created</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.slice(0, 20).map((complaint) => (
                  <tr key={complaint.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{complaint.title}</p>
                        {complaint.guest_name && (
                          <p className="text-xs text-muted-foreground">
                            {complaint.guest_name}
                            {complaint.room_number && ` • Room ${complaint.room_number}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <Badge variant="secondary">{complaint.department?.name || "Unassigned"}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          complaint.status === "resolved"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-orange-500/10 text-orange-600 border-orange-500/20",
                        )}
                      >
                        {complaint.status === "resolved" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertCircle className="h-3 w-3 mr-1" />
                        )}
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          complaint.priority === "urgent" && "bg-red-500/10 text-red-600 border-red-500/20",
                          complaint.priority === "normal" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                          complaint.priority === "low" && "bg-green-500/10 text-green-600 border-green-500/20",
                        )}
                      >
                        {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {format(new Date(complaint.created_at), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {complaint.resolved_at ? format(new Date(complaint.resolved_at), "MMM dd, yyyy") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredComplaints.length > 20 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Showing 20 of {filteredComplaints.length} complaints. Export to see all.
              </p>
            )}
            {filteredComplaints.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No complaints match your selected filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
