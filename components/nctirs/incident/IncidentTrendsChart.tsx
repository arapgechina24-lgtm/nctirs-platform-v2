'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from "lucide-react"

interface IncidentTrendData {
  date: string;
  total: number;
  [key: string]: string | number;
}

interface IncidentTrendsChartProps {
  data: IncidentTrendData[];
}

export function IncidentTrendsChart({ data }: IncidentTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          30-Day Incident Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#003b00" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#008f11"
              style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis stroke="#008f11" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #00ff41',
                borderRadius: '0px',
                color: '#00ff41',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase' }} />
            <Line
              type="monotone"
              dataKey="total"
              name="TOTAL_INCIDENTS"
              stroke="#00ff41"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="TERRORISM"
              name="TERRORISM"
              stroke="#ff0000"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ORGANIZED_CRIME"
              name="ORG_CRIME"
              stroke="#008f11"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="CYBER_ATTACK"
              name="CYBER"
              stroke="#003b00"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
