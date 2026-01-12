"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays } from "date-fns"

interface DatePickerProps {
  selectedDate: string
}

export function DatePicker({ selectedDate }: DatePickerProps) {
  const router = useRouter()
  const date = new Date(selectedDate)

  const navigateToDate = (newDate: Date) => {
    router.push(`/dashboard/notes?date=${newDate.toISOString().split("T")[0]}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigateToDate(subDays(date, 1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-start bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, "EEEE, MMMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={(d) => d && navigateToDate(d)} initialFocus />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateToDate(addDays(date, 1))}
        disabled={selectedDate >= new Date().toISOString().split("T")[0]}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="secondary" onClick={() => navigateToDate(new Date())} className="ml-2">
        Today
      </Button>
    </div>
  )
}
