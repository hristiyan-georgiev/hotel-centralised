export interface EmployeeConfig {
  id: string
  name: string
  weeklyHours: number
  daysOff: string[]
}

export interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  minStaff: number
}

export interface GeneratedShift {
  staff_id: string
  staff_name: string
  date: string
  start_time: string
  end_time: string
  shift_name: string
  hours: number
}

export interface ScheduleOption {
  id: number
  name: string
  shifts: GeneratedShift[]
  totalHours: number
  coverage: number
  fairnessScore: number
}

export interface ScheduleGeneratorInput {
  startDate: string
  endDate: string
  employeeConfigs: EmployeeConfig[]
  shiftDefinitions: ShiftDefinition[]
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

const getShiftEndDateTime = (date: string, endTime: string): Date => {
  const [hours, minutes] = endTime.split(":").map(Number)
  const shiftEnd = new Date(date)
  shiftEnd.setHours(hours, minutes || 0, 0, 0)
  
  // If end time is earlier than typical start (e.g., night shift ending at 06:00)
  // and it's less than 12, assume it's the next day
  if (hours < 12) {
    // Check if this might be a night shift by looking at common patterns
    // Night shifts typically end between 00:00 and 10:00
    const isLikelyNextDay = hours <= 10
    if (isLikelyNextDay) {
      shiftEnd.setDate(shiftEnd.getDate() + 1)
    }
  }
  
  return shiftEnd
}

const getShiftStartDateTime = (date: string, startTime: string): Date => {
  const [hours, minutes] = startTime.split(":").map(Number)
  const shiftStart = new Date(date)
  shiftStart.setHours(hours, minutes || 0, 0, 0)
  return shiftStart
}

const hasMinimumRestPeriod = (lastShiftEnd: Date, nextShiftStart: Date, minHours: number = 12): boolean => {
  const hoursDifference = (nextShiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60)
  return hoursDifference >= minHours
}

export function generateScheduleOptions(input: ScheduleGeneratorInput): ScheduleOption[] {
  const { startDate, endDate, employeeConfigs, shiftDefinitions } = input
  const dates = getDatesInRange(startDate, endDate)
  const options: ScheduleOption[] = []

  // Generate 3 different schedule options
  for (let optionIndex = 0; optionIndex < 3; optionIndex++) {
    const shifts: GeneratedShift[] = []
    const employeeHours: Record<string, number> = {}
    const employeeShiftCounts: Record<string, Record<string, number>> = {}
    const employeeLastShiftEnd: Record<string, Date | null> = {}

    // Initialise tracking
    employeeConfigs.forEach((e) => {
      employeeHours[e.id] = 0
      employeeShiftCounts[e.id] = {}
      employeeLastShiftEnd[e.id] = null
      shiftDefinitions.forEach((s) => {
        employeeShiftCounts[e.id][s.id] = 0
      })
    })

    // For each date, assign shifts for each shift type
    dates.forEach((date) => {
      // Get available employees for this date (not on day off)
      const availableForDay = employeeConfigs.filter((e) => !e.daysOff.includes(date))

      // Process each shift type
      shiftDefinitions.forEach((shiftDef) => {
        const shiftHours = getShiftHours(shiftDef.startTime, shiftDef.endTime)
        const currentShiftStart = getShiftStartDateTime(date, shiftDef.startTime)

        // Get employees who can still work more hours and have minimum rest period
        const availableEmployees = availableForDay.filter((e) => {
          // Check weekly hours limit
          if (employeeHours[e.id] + shiftHours > e.weeklyHours * 1.1) {
            return false
          }
          
          // Check minimum rest period (12 hours between shifts)
          const lastShiftEnd = employeeLastShiftEnd[e.id]
          if (lastShiftEnd && !hasMinimumRestPeriod(lastShiftEnd, currentShiftStart)) {
            return false
          }
          
          return true
        })

        // Different strategies for different options
        let employeesToSchedule: EmployeeConfig[] = []

        if (optionIndex === 0) {
          // Option 1: Balanced Distribution - prioritise rotation and even hours
          employeesToSchedule = [...availableEmployees].sort((a, b) => {
            // Primary: Rotate shift types - prefer those who haven't worked this shift type
            const shiftTypeDiff = employeeShiftCounts[a.id][shiftDef.id] - employeeShiftCounts[b.id][shiftDef.id]
            if (shiftTypeDiff !== 0) return shiftTypeDiff
            
            // Secondary: Balance total hours
            const hoursDiff = employeeHours[a.id] - employeeHours[b.id]
            if (Math.abs(hoursDiff) > 4) return hoursDiff
            
            // Tertiary: Prefer those with fewer total shifts worked
            const totalShiftsA = Object.values(employeeShiftCounts[a.id]).reduce((sum, count) => sum + count, 0)
            const totalShiftsB = Object.values(employeeShiftCounts[b.id]).reduce((sum, count) => sum + count, 0)
            return totalShiftsA - totalShiftsB
          })
        } else if (optionIndex === 1) {
          // Option 2: Maximum Coverage - more staff, with rotation
          employeesToSchedule = [...availableEmployees].sort((a, b) => {
            // Primary: Balance hours to maximise coverage
            const hoursDiff = employeeHours[a.id] - employeeHours[b.id]
            if (Math.abs(hoursDiff) > 6) return hoursDiff
            
            // Secondary: Rotate shift types
            return employeeShiftCounts[a.id][shiftDef.id] - employeeShiftCounts[b.id][shiftDef.id]
          })
        } else {
          // Option 3: Minimal Overtime - strict hours with diversity
          employeesToSchedule = availableEmployees
            .filter((e) => employeeHours[e.id] + shiftHours <= e.weeklyHours)
            .sort((a, b) => {
              // Primary: Prefer those who haven't worked this shift type much
              const shiftTypeDiff = employeeShiftCounts[a.id][shiftDef.id] - employeeShiftCounts[b.id][shiftDef.id]
              if (shiftTypeDiff !== 0) return shiftTypeDiff
              
              // Secondary: Balance hours within strict limits
              return employeeHours[a.id] - employeeHours[b.id]
            })
        }

        // Assign staff based on minimum required for this shift
        const staffNeeded =
          optionIndex === 1
            ? Math.min(
                availableEmployees.length,
                Math.max(shiftDef.minStaff, Math.ceil(availableEmployees.length * 0.5)),
              )
            : shiftDef.minStaff

        employeesToSchedule.slice(0, staffNeeded).forEach((employee) => {
          const shiftEndDateTime = getShiftEndDateTime(date, shiftDef.endTime)
          
          shifts.push({
            staff_id: employee.id,
            staff_name: employee.name,
            date,
            start_time: shiftDef.startTime,
            end_time: shiftDef.endTime,
            shift_name: shiftDef.name,
            hours: shiftHours,
          })
          employeeHours[employee.id] += shiftHours
          employeeShiftCounts[employee.id][shiftDef.id]++
          employeeLastShiftEnd[employee.id] = shiftEndDateTime
        })
      })
    })

    // Calculate metrics
    const totalHours = Object.values(employeeHours).reduce((a, b) => a + b, 0)
    const weekCount = Math.max(1, dates.length / 7)
    const targetHours = employeeConfigs.reduce((a, e) => a + e.weeklyHours, 0) * weekCount
    const coverage = Math.min(100, Math.round((totalHours / targetHours) * 100))

    // Fairness score based on distribution
    const avgHours = totalHours / employeeConfigs.length
    const variance =
      employeeConfigs.reduce((sum, e) => sum + Math.pow(employeeHours[e.id] - avgHours, 2), 0) /
      employeeConfigs.length
    const fairnessScore = Math.max(0, Math.round(100 - Math.sqrt(variance)))

    options.push({
      id: optionIndex + 1,
      name:
        optionIndex === 0 ? "Balanced Distribution" : optionIndex === 1 ? "Maximum Coverage" : "Minimal Overtime",
      shifts,
      totalHours,
      coverage,
      fairnessScore,
    })
  }

  return options
}
