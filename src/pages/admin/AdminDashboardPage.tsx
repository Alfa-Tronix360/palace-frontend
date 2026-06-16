import { KPIGrid } from '@/features/dashboard/components/KPIGrid'
import { ReservationsChart } from '@/features/dashboard/components/ReservationsChart'
import { RevenueChart } from '@/features/dashboard/components/RevenueChart'
import { OccupancyChart } from '@/features/dashboard/components/OccupancyChart'
import { RecentReservations } from '@/features/dashboard/components/RecentReservations'
import { AlertsPanel } from '@/features/dashboard/components/AlertsPanel'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVenueStore } from '@/store/venue.store'

function TopEmployeesDashboardCard() {
  const employeeOrders = useVenueStore((state) => state.employeeOrders)
  const topEmployees = useMemo(() => {
    return employeeOrders
      .reduce<Array<{ id: string; name: string; total: number; orders: number }>>((acc, order) => {
        const item = acc.find((entry) => entry.id === order.employeeId)
        if (item) {
          item.total += order.total
          item.orders += 1
        } else {
          acc.push({ id: order.employeeId, name: order.employeeName, total: order.total, orders: 1 })
        }
        return acc
      }, [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [employeeOrders])

  return (
    <section className="rounded-xl border border-border/40 bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Top funcionarios</p>
          <p className="text-xs text-muted-foreground">Atendentes que mais vendem</p>
        </div>
      </div>
      <div className="space-y-3">
        {topEmployees.length ? topEmployees.map((employee, index) => (
          <div key={employee.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
            <div>
              <p className="text-sm font-medium">{index + 1}. {employee.name}</p>
              <p className="text-xs text-muted-foreground">{employee.orders} pedidos</p>
            </div>
            <p className="text-sm font-semibold text-primary">{formatCurrency(employee.total)}</p>
          </div>
        )) : (
          <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            O ranking aparece depois dos primeiros pedidos lancados.
          </div>
        )}
      </div>
    </section>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>
          {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
        </p>
        <h1 className="font-display text-3xl text-primary">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral das operações do Palace Lounge</p>
      </motion.div>

      {/* KPIs */}
      <KPIGrid />

      {/* Alertas */}
      <AlertsPanel />

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><ReservationsChart /></div>
        <div><OccupancyChart /></div>
      </div>

      {/* Charts row 2 + Recent */}
      <div className="grid lg:grid-cols-3 gap-5">
        <RevenueChart />
        <RecentReservations />
        <TopEmployeesDashboardCard />
      </div>
    </div>
  )
}
