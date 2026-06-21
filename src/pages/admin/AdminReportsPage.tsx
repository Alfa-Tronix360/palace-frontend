import { motion } from 'framer-motion'
import { Download, Printer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/api/http'
import { ReservationsChart } from '@/features/dashboard/components/ReservationsChart'
import { RevenueChart } from '@/features/dashboard/components/RevenueChart'
import {
  CancellationsReport, TopClientsReport,
  OccupancyReport, TopProductsReport,
  TableTicketRevenueReport, TopEmployeesSalesReport, TopReservedTablesReport,
} from '@/features/admin-reports/components/ReportsCharts'

function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).join(',')).join('\n')
  const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReportsPage() {
  const { data: topClients = [] } = useQuery({
    queryKey: ['reports', 'top-clients'],
    queryFn: () => http.get<unknown, any[]>('/reports/top-clients'),
  })

  const { data: employeeSales = [] } = useQuery({
    queryKey: ['reports', 'employee-sales'],
    queryFn: () => http.get<unknown, any[]>('/reports/employees/sales'),
  })

  const { data: tableTickets = [] } = useQuery({
    queryKey: ['reports', 'table-ticket-sales'],
    queryFn: () => http.get<unknown, any[]>('/reports/tables/ticket-sales'),
  })

  const { data: revenue } = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: () => http.get<unknown, any>('/reports/revenue'),
  })

  function exportAll() {
    exportCSV('palace_top_clientes.csv', topClients.map(c => ({
      'Cliente': c.client_name,
      'Reservas': c.reservations,
    })))
    exportCSV('palace_funcionarios.csv', employeeSales.map(e => ({
      'Funcionário': e.employee_name,
      'Pedidos': e.orders,
      'Receita (Kz)': e.revenue,
    })))
    exportCSV('palace_convites_por_mesa.csv', tableTickets.map(t => ({
      'Mesa': t.table_number,
      'Convites Vendidos': t.sold,
      'Receita (Kz)': t.revenue,
    })))
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Análise</p>
          <h1 className="font-display text-3xl text-primary">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Dados operacionais e financeiros do Palace Lounge</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAll}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#D9D0B5', color: '#181818' }}>
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
      </motion.div>

      {revenue && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Reservas</p>
            <p className="text-xl font-bold text-foreground">{(revenue.reservations / 1000).toFixed(0)}K Kz</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Bilhetes</p>
            <p className="text-xl font-bold text-foreground">{(revenue.tickets / 1000).toFixed(0)}K Kz</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold" style={{ color: '#B89A67' }}>{(revenue.total / 1000).toFixed(0)}K Kz</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <ReservationsChart />
        <RevenueChart />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <OccupancyReport />
        <CancellationsReport />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <TopClientsReport />
        <TopProductsReport />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <TopReservedTablesReport />
        <TableTicketRevenueReport />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <TopEmployeesSalesReport />
      </div>
    </div>
  )
}