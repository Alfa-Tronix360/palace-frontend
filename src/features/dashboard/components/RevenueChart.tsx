import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { paymentsAdapter } from '@/services/adapters/payments.adapter'

const fmt = (v: number) => `${(v / 1000000).toFixed(1)}M`

const tooltipStyle = {
  backgroundColor: '#232323',
  border: '1px solid #333333',
  borderRadius: '8px',
  color: '#F8F6F0',
  fontSize: '12px',
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function RevenueChart() {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsAdapter.getAll(),
  })

  const chartData = MONTHS.map((month, index) => {
    const receita = payments
      .filter(p => new Date(p.date).getMonth() === index && p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0)
    return { month, receita }
  })

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Receita Mensal</p>
      <p className="text-xs text-muted-foreground mb-4">AOA · últimos 12 meses</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D9D0B5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D9D0B5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${(Number(v) / 1000000).toFixed(2)}M AOA`, '']} />
          <Area type="monotone" dataKey="receita" name="Receita" stroke="#D9D0B5" strokeWidth={2} fill="url(#receitaGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}