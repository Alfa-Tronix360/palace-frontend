import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { tablesAdapter } from '@/services/adapters/tables.adapter'

const COLORS: Record<string, string> = {
  indoor: '#D9D0B5',
  outdoor: '#B89A67',
  vip: '#A89A85',
}

const LABELS: Record<string, string> = {
  indoor: 'Interior',
  outdoor: 'Exterior',
  vip: 'VIP',
}

const tooltipStyle = {
  backgroundColor: '#232323',
  border: '1px solid #333333',
  borderRadius: '8px',
  color: '#F8F6F0',
  fontSize: '12px',
}

export function OccupancyChart() {
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })

  const locationCounts = tables.reduce<Record<string, number>>((acc, table) => {
    acc[table.location] = (acc[table.location] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(locationCounts).map(([location, count]) => ({
    name: LABELS[location] || location,
    value: count,
    color: COLORS[location] || '#2d2d2d',
  }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Ocupação das Mesas</p>
      <p className="text-xs text-muted-foreground mb-2">Distribuição por zona</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} mesas`, '']} />
          <Legend formatter={(v) => <span style={{ color: '#A89A85', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}