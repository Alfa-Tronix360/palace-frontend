import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'

const tooltipStyle = {
  backgroundColor: '#232323',
  border: '1px solid #333333',
  borderRadius: '8px',
  color: '#F8F6F0',
  fontSize: '12px',
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function ReservationsChart() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsAdapter.getAll(),
  })

  const chartData = MONTHS.map((month, index) => {
    const confirmed = reservations.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() === index && r.status === 'confirmed'
    }).length
    const cancelled = reservations.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() === index && r.status === 'cancelled'
    }).length
    return { month, reservas: confirmed, canceladas: cancelled }
  })

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Reservas por Mês</p>
      <p className="text-xs text-muted-foreground mb-4">Últimos 12 meses</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend formatter={(v) => <span style={{ color: '#A89A85', fontSize: 11 }}>{v}</span>} />
          <Bar dataKey="reservas" name="Confirmadas" fill="#D9D0B5" radius={[3, 3, 0, 0]} />
          <Bar dataKey="canceladas" name="Canceladas" fill="#C74A4A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}