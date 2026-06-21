import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/api/http'

const tooltip = {
  backgroundColor: '#232323',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#F8F6F0',
  fontSize: '12px',
}

export function CancellationsReport() {
  const { data: cancelData = [] } = useQuery({
    queryKey: ['reports', 'cancellations-monthly'],
    queryFn: () => http.get<unknown, any[]>('/reports/cancellations/monthly'),
  })

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Cancelamentos e No-Shows</p>
      <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={cancelData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend formatter={v => <span style={{ color: '#A89A85', fontSize: 11 }}>{v}</span>} />
          <Bar dataKey="cancelamentos" name="Cancelamentos" fill="#C74A4A" radius={[3, 3, 0, 0]} />
          <Bar dataKey="noShows" name="No-Shows" fill="#D6A93D" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
export function TopClientsReport() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'top-clients'],
    queryFn: () => http.get<unknown, any[]>('/reports/top-clients'),
  })

  const chartData = data.map(c => ({ name: c.client_name, gasto: c.reservations * 10000 }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Top 5 Clientes</p>
      <p className="text-xs text-muted-foreground mb-4">Por número de reservas</p>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#A89A85', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
            <Tooltip contentStyle={tooltip} />
            <Bar dataKey="gasto" name="Reservas" fill="#D9D0B5" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sem dados ainda.</div>
      )}
    </div>
  )
}

export function OccupancyReport() {
  const { data: occupancyTrend = [] } = useQuery({
    queryKey: ['reports', 'occupancy-weekly'],
    queryFn: () => http.get<unknown, any[]>('/reports/occupancy/weekly'),
  })

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Taxa de Ocupação Semanal</p>
      <p className="text-xs text-muted-foreground mb-4">% das mesas ocupadas</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={occupancyTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltip} formatter={(v) => [`${v}%`, '']} />
          <Line type="monotone" dataKey="taxa" name="Ocupação" stroke="#D9D0B5" strokeWidth={2.5} dot={{ fill: '#D9D0B5', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
export function TopProductsReport() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'employee-sales'],
    queryFn: () => http.get<unknown, any[]>('/reports/employees/sales'),
  })

  const colors = ['#D9D0B5', '#B89A67', '#A89A85', '#7a6a55', '#4a3f30']
  const chartData = data.slice(0, 5).map((e, i) => ({
    name: e.employee_name,
    vendas: e.orders,
    color: colors[i],
  }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Funcionários com mais Pedidos</p>
      <p className="text-xs text-muted-foreground mb-4">Nº de pedidos lançados</p>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" outerRadius={75} paddingAngle={2} dataKey="vendas">
              {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltip} formatter={(v) => [`${v} pedidos`, '']} />
            <Legend formatter={v => <span style={{ color: '#A89A85', fontSize: 11 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">Sem dados ainda.</div>
      )}
    </div>
  )
}

export function TopReservedTablesReport() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'tables-reservations'],
    queryFn: () => http.get<unknown, any[]>('/reports/tables/reservations'),
  })

  const chartData = data.slice(0, 6).map(t => ({
    name: `Mesa ${t.table_id}`,
    reservas: t.reservations,
  }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Mesas mais Reservadas</p>
      <p className="text-xs text-muted-foreground mb-4">Ranking por número de reservas</p>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltip} />
            <Bar dataKey="reservas" name="Reservas" fill="#D9D0B5" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground">
          As mesas mais reservadas aparecem aqui.
        </div>
      )}
    </div>
  )
}

export function TableTicketRevenueReport() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'table-ticket-sales'],
    queryFn: () => http.get<unknown, any[]>('/reports/tables/ticket-sales'),
  })

  const chartData = data.slice(0, 6).map(t => ({
    name: `Mesa ${t.table_number}`,
    receita: t.revenue,
    convites: t.sold,
  }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Mesas mais Vendidas</p>
      <p className="text-xs text-muted-foreground mb-4">Receita de convites digitais por mesa</p>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}K`}
              tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#A89A85', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={tooltip} formatter={(v, name) => name === 'receita' ? [`${(Number(v) / 1000).toFixed(0)}K AOA`, 'Receita'] : [v, 'Convites']} />
            <Bar dataKey="receita" name="Receita" fill="#B89A67" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground">
          As vendas por mesa aparecem depois da primeira compra de convite.
        </div>
      )}
    </div>
  )
}

export function TopEmployeesSalesReport() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'employee-sales'],
    queryFn: () => http.get<unknown, any[]>('/reports/employees/sales'),
  })

  const chartData = data.slice(0, 6).map(e => ({
    name: e.employee_name,
    receita: e.revenue,
    pedidos: e.orders,
  }))

  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5">
      <p className="text-sm font-semibold text-foreground mb-1">Funcionários que mais Vendem</p>
      <p className="text-xs text-muted-foreground mb-4">Receita dos pedidos lançados por atendente</p>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}K`}
              tick={{ fill: '#A89A85', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#A89A85', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip contentStyle={tooltip} formatter={(v, name) => name === 'receita' ? [`${(Number(v) / 1000).toFixed(0)}K AOA`, 'Receita'] : [v, 'Pedidos']} />
            <Bar dataKey="receita" name="Receita" fill="#D9D0B5" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground">
          O ranking aparece depois dos primeiros pedidos lançados.
        </div>
      )}
    </div>
  )
}