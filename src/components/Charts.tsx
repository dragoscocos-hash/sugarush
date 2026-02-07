import { Card } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DailySummary } from '@/types'
import { format } from 'date-fns'

interface Props {
  data: DailySummary[]
  type: 'week' | 'month'
}

export function Charts({ data, type: _type }: Props) {
  const chartData = data.map((day) => ({
    date: format(new Date(day.date), 'MMM dd'),
    gl: day.totalGL,
    calories: day.totalCalories,
  }))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Glycemic Load</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
              }}
            />
            <Bar dataKey="gl" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Calories</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
              }}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
