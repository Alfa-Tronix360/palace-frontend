import { motion } from 'framer-motion'
import { ReservationsChart } from '@/features/dashboard/components/ReservationsChart'
import { RevenueChart }       from '@/features/dashboard/components/RevenueChart'
import {
  CancellationsReport, TopClientsReport,
  OccupancyReport, TopProductsReport,
  TableTicketRevenueReport, TopReservedTablesReport,
} from '@/features/admin-reports/components/ReportsCharts'

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Análise</p>
        <h1 className="font-display text-3xl text-primary">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">Dados operacionais e financeiros do Palace Lounge</p>
      </motion.div>

      {/* Reservations + Revenue */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ReservationsChart />
        <RevenueChart />
      </div>

      {/* Occupancy + Cancellations */}
      <div className="grid lg:grid-cols-2 gap-5">
        <OccupancyReport />
        <CancellationsReport />
      </div>

      {/* Top clients + Top products */}
      <div className="grid lg:grid-cols-2 gap-5">
        <TopClientsReport />
        <TopProductsReport />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <TopReservedTablesReport />
        <TableTicketRevenueReport />
      </div>
    </div>
  )
}
