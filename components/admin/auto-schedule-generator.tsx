"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Users, Check, Wand2, Loader2, AlertCircle, Plus, Trash2, Clock } from "lucide-react"
import type { Department, Profile } from "@/lib/types"
import {
  generateScheduleOptions,
  type EmployeeConfig,
  type ShiftDefinition,
  type GeneratedShift,
  type ScheduleOption,
} from "@/lib/schedule-generator"

interface AutoScheduleGeneratorProps {
  open: boolean
  onClose: () => void
  departments: Department[]
  staffMembers: Profile[]
}


const STEPS = [
  { id: 1, title: "Department", description: "Select department" },
  { id: 2, title: "Employees", description: "Choose staff" },
  { id: 3, title: "Shifts", description: "Define shift types" },
  { id: 4, title: "Configuration", description: "Set hours & days off" },
  { id: 5, title: "Timeline", description: "Set date range" },
  { id: 6, title: "Review Options", description: "Choose schedule" },
]

const SHIFT_TEMPLATES = [
  { name: "Morning", start: "06:00", end: "14:00" },
  { name: "Day", start: "09:00", end: "17:00" },
  { name: "Afternoon", start: "14:00", end: "22:00" },
  { name: "Night", start: "22:00", end: "06:00" },
]

export function AutoScheduleGenerator({ open, onClose, departments, staffMembers }: AutoScheduleGeneratorProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Step 1: Department
  const [selectedDepartment, setSelectedDepartment] = useState("")

  // Step 2: Employees
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>([
    { id: "1", name: "Morning", startTime: "06:00", endTime: "14:00", minStaff: 1 },
    { id: "2", name: "Evening", startTime: "14:00", endTime: "22:00", minStaff: 1 },
  ])

  // Step 4: Configuration
  const [employeeConfigs, setEmployeeConfigs] = useState<EmployeeConfig[]>([])

  // Step 5: Timeline
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Step 6: Generated Options
  const [generatedOptions, setGeneratedOptions] = useState<ScheduleOption[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  // Filter staff by department
  const departmentStaff = useMemo(() => {
    return staffMembers.filter((s) => s.department_id === selectedDepartment)
  }, [staffMembers, selectedDepartment])

  // Reset when dialog closes
  const handleClose = () => {
    setCurrentStep(1)
    setSelectedDepartment("")
    setSelectedEmployees([])
    setShiftDefinitions([
      { id: "1", name: "Morning", startTime: "06:00", endTime: "14:00", minStaff: 1 },
      { id: "2", name: "Evening", startTime: "14:00", endTime: "22:00", minStaff: 1 },
    ])
    setEmployeeConfigs([])
    setStartDate("")
    setEndDate("")
    setGeneratedOptions([])
    setSelectedOption(null)
    onClose()
  }

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedDepartment !== ""
      case 2:
        return selectedEmployees.length > 0
      case 3:
        return (
          shiftDefinitions.length > 0 &&
          shiftDefinitions.every((s) => s.name && s.startTime && s.endTime && s.minStaff > 0)
        )
      case 4:
        return employeeConfigs.every((e) => e.weeklyHours > 0)
      case 5:
        return startDate !== "" && endDate !== "" && new Date(endDate) >= new Date(startDate)
      case 6:
        return selectedOption !== null
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep === 3) {
      // Initialize employee configs when moving to step 4
      setEmployeeConfigs(
        selectedEmployees.map((id) => {
          const staff = staffMembers.find((s) => s.id === id)
          return {
            id,
            name: staff?.full_name || "",
            weeklyHours: 40,
            daysOff: [],
          }
        }),
      )
    }
    if (currentStep === 5) {
      handleGenerateSchedule()
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 6))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Toggle employee selection
  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  // Update employee config
  const updateEmployeeConfig = (id: string, field: keyof EmployeeConfig, value: number | string[]) => {
    setEmployeeConfigs((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  // Toggle day off for employee
  const toggleDayOff = (employeeId: string, date: string) => {
    setEmployeeConfigs((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          const newDaysOff = e.daysOff.includes(date) ? e.daysOff.filter((d) => d !== date) : [...e.daysOff, date]
          return { ...e, daysOff: newDaysOff }
        }
        return e
      }),
    )
  }

  const addShiftDefinition = () => {
    const newId = Date.now().toString()
    setShiftDefinitions((prev) => [...prev, { id: newId, name: "", startTime: "09:00", endTime: "17:00", minStaff: 1 }])
  }

  const removeShiftDefinition = (id: string) => {
    if (shiftDefinitions.length > 1) {
      setShiftDefinitions((prev) => prev.filter((s) => s.id !== id))
    }
  }

  const updateShiftDefinition = (id: string, field: keyof ShiftDefinition, value: string | number) => {
    setShiftDefinitions((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const applyShiftTemplate = (template: (typeof SHIFT_TEMPLATES)[0]) => {
    const newId = Date.now().toString()
    const exists = shiftDefinitions.some((s) => s.name === template.name)
    if (!exists) {
      setShiftDefinitions((prev) => [
        ...prev,
        { id: newId, name: template.name, startTime: template.start, endTime: template.end, minStaff: 1 },
      ])
    }
  }

  const getShiftHours = (startTime: string, endTime: string): number => {
    const start = Number.parseInt(startTime.split(":")[0])
    const end = Number.parseInt(endTime.split(":")[0])
    return end > start ? end - start : 24 - start + end
  }

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates: string[] = []
    const currentDate = new Date(start)
    const endDateObj = new Date(end)
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split("T")[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const handleGenerateSchedule = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const options = generateScheduleOptions({
        startDate,
        endDate,
        employeeConfigs,
        shiftDefinitions,
      })

      setGeneratedOptions(options)
      setCurrentStep(6)
      setIsGenerating(false)
    }, 1500)
  }

  const handleSaveSchedule = async () => {
    if (selectedOption === null) return

    setIsSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const option = generatedOptions.find((o) => o.id === selectedOption)
    if (!option) return

    // Insert all shifts
    const shiftsToInsert = option.shifts.map((shift) => ({
      staff_id: shift.staff_id,
      department_id: selectedDepartment,
      shift_date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_name.toLowerCase(),
      created_by: user?.id,
    }))

    await supabase.from("shifts").insert(shiftsToInsert)

    setIsSaving(false)
    handleClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Wand2 className="h-5 w-5 text-primary" />
                Auto-Generate Rota (In-Progress)
              </DialogTitle>
              <DialogDescription className="mt-1">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</DialogDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    currentStep >= step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Step 1: Department Selection */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Select Department</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the department you want to create a schedule for
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {departments.map((dept) => (
                    <Card
                      key={dept.id}
                      className={`cursor-pointer transition-colors hover:border-primary/50 ${
                        selectedDepartment === dept.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedDepartment(dept.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              selectedDepartment === dept.id ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {staffMembers.filter((s) => s.department_id === dept.id).length} staff members
                            </p>
                          </div>
                          {selectedDepartment === dept.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Employee Selection */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Select Employees</h3>
                    <p className="text-sm text-muted-foreground">Choose staff members to include in the rota</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{selectedEmployees.length} selected</Badge>
                </div>
                {departmentStaff.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No staff members in this department</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {departmentStaff.map((staff) => (
                      <Card
                        key={staff.id}
                        className={`cursor-pointer transition-colors hover:border-primary/50 ${
                          selectedEmployees.includes(staff.id) ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => toggleEmployee(staff.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedEmployees.includes(staff.id)}
                              onCheckedChange={() => toggleEmployee(staff.id)}
                              className="shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{staff.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Define Shift Types</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up the shifts that need to be covered each day
                  </p>
                </div>

                {/* Quick Templates */}
                <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium text-muted-foreground mr-2">Quick add:</span>
                  {SHIFT_TEMPLATES.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => applyShiftTemplate(template)}
                      disabled={shiftDefinitions.some((s) => s.name === template.name)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {template.name}
                    </Button>
                  ))}
                </div>

                {/* Shift Definitions List */}
                <div className="space-y-3">
                  {shiftDefinitions.map((shift, index) => (
                    <Card key={shift.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`shift-name-${shift.id}`} className="text-xs font-medium text-muted-foreground">
                                  Shift Name
                                </Label>
                                <Input
                                  id={`shift-name-${shift.id}`}
                                  placeholder="e.g., Morning"
                                  value={shift.name}
                                  onChange={(e) => updateShiftDefinition(shift.id, "name", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`min-staff-${shift.id}`} className="text-xs font-medium text-muted-foreground">
                                  Min Staff
                                </Label>
                                <Input
                                  id={`min-staff-${shift.id}`}
                                  type="number"
                                  min={1}
                                  max={selectedEmployees.length}
                                  value={shift.minStaff}
                                  onChange={(e) =>
                                    updateShiftDefinition(shift.id, "minStaff", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="h-9"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`start-${shift.id}`} className="text-xs font-medium text-muted-foreground">
                                  Start Time
                                </Label>
                                <Input
                                  id={`start-${shift.id}`}
                                  type="time"
                                  value={shift.startTime}
                                  onChange={(e) => updateShiftDefinition(shift.id, "startTime", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`end-${shift.id}`} className="text-xs font-medium text-muted-foreground">
                                  End Time
                                </Label>
                                <Input
                                  id={`end-${shift.id}`}
                                  type="time"
                                  value={shift.endTime}
                                  onChange={(e) => updateShiftDefinition(shift.id, "endTime", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Duration: {getShiftHours(shift.startTime, shift.endTime)} hours
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-transparent"
                            onClick={() => removeShiftDefinition(shift.id)}
                            disabled={shiftDefinitions.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" onClick={addShiftDefinition} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Shift
                </Button>

                {/* Summary */}
                <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Shifts per day:</span>
                    <Badge variant="secondary">{shiftDefinitions.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total coverage:</span>
                    <Badge variant="secondary">
                      {shiftDefinitions.reduce((sum, s) => sum + getShiftHours(s.startTime, s.endTime), 0)}h
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Min staff:</span>
                    <Badge variant="secondary">
                      {shiftDefinitions.reduce((sum, s) => sum + s.minStaff, 0)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Configuration */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Configure Hours & Days Off</h3>
                  <p className="text-sm text-muted-foreground">
                    Set weekly hours for each employee
                  </p>
                </div>
                <div className="space-y-2">
                  {employeeConfigs.map((employee) => (
                    <Card key={employee.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{employee.name}</p>
                            {employee.daysOff.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {employee.daysOff.length} day(s) off
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`hours-${employee.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                              Weekly hours
                            </Label>
                            <Input
                              id={`hours-${employee.id}`}
                              type="number"
                              min={1}
                              max={60}
                              value={employee.weeklyHours}
                              onChange={(e) =>
                                updateEmployeeConfig(employee.id, "weeklyHours", Number.parseInt(e.target.value) || 0)
                              }
                              className="w-20 h-9"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Timeline */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Set Timeline</h3>
                  <p className="text-sm text-muted-foreground">Define the date range for the rota</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Shift Summary */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Shifts to Generate</p>
                  <div className="flex flex-wrap gap-2">
                    {shiftDefinitions.map((shift) => (
                      <Badge key={shift.id} variant="secondary" className="text-xs">
                        {shift.name} • {shift.startTime}-{shift.endTime}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Days Off Selection */}
                {startDate && endDate && getDatesInRange(startDate, endDate).length <= 14 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Set Days Off (Optional)</p>
                      <p className="text-xs text-muted-foreground">Click dates to mark days off</p>
                    </div>
                    <div className="space-y-3">
                      {employeeConfigs.map((employee) => (
                        <div key={employee.id} className="space-y-2">
                          <p className="text-xs font-medium">{employee.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {getDatesInRange(startDate, endDate).map((date) => {
                              const isOff = employee.daysOff.includes(date)
                              const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" })
                              const dayNum = new Date(date).getDate()
                              return (
                                <Button
                                  key={date}
                                  variant={isOff ? "destructive" : "outline"}
                                  size="sm"
                                  className="h-auto py-1 px-2 text-xs"
                                  onClick={() => toggleDayOff(employee.id, date)}
                                >
                                  <span className="flex flex-col items-center leading-tight">
                                    <span>{dayName}</span>
                                    <span className="font-medium">{dayNum}</span>
                                  </span>
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Review Options */}
            {currentStep === 6 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Select Schedule Option</h3>
                  <p className="text-sm text-muted-foreground">Review generated schedules and choose the best fit</p>
                </div>

                {isGenerating ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Generating schedule options...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {generatedOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-colors hover:border-primary/50 ${
                          selectedOption === option.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedOption(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{option.name}</h4>
                              {selectedOption === option.id && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <Badge variant="secondary" className="text-xs">{option.shifts.length} shifts</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-md bg-muted/50">
                              <p className="text-xl font-bold">{option.totalHours}h</p>
                              <p className="text-xs text-muted-foreground">Total Hours</p>
                            </div>
                            <div className="text-center p-3 rounded-md bg-muted/50">
                              <p className="text-xl font-bold">{option.coverage}%</p>
                              <p className="text-xs text-muted-foreground">Coverage</p>
                            </div>
                            <div className="text-center p-3 rounded-md bg-muted/50">
                              <p className="text-xl font-bold">{option.fairnessScore}%</p>
                              <p className="text-xs text-muted-foreground">Fairness</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <Button variant="ghost" size="sm" onClick={currentStep === 1 ? handleClose : handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Back"}
          </Button>

          {currentStep < 6 ? (
            <Button size="sm" onClick={handleNext} disabled={!canProceed() || isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {currentStep === 5 ? "Generate Options" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button size="sm" onClick={handleSaveSchedule} disabled={selectedOption === null || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply Schedule
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
