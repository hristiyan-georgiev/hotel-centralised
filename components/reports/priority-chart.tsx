"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

interface PriorityChartProps {
  data: { name: string; value: number; fill: string }[]
}

export function PriorityChart({ data }: PriorityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  const COLORS = {
    Urgent: "hsl(0, 84%, 60%)",
    Normal: "hsl(45, 93%, 47%)",
    Low: "hsl(142, 76%, 36%)",
  }

  return (
    <ChartContainer
      config={{
        urgent: { label: "Urgent", color: COLORS.Urgent },
        normal: { label: "Normal", color: COLORS.Normal },
        low: { label: "Low", color: COLORS.Low },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "hsl(var(--primary))"} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{payload[0].name}</span>
                      <span className="text-muted-foreground">{payload[0].value} complaints</span>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
