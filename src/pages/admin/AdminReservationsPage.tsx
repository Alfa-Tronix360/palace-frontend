import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ReservationsTable } from '@/features/admin-reservations/components/ReservationsTable'
import { CreateReservationDialog } from '@/features/admin-reservations/components/CreateReservationDialog'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { PhoneReservation } from '@/components/forms/PhoneReservation'

export default function AdminReservationsPage() {
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsAdapter.getAll(),
  })

  const stats = [
    { label: 'Total', value: reservations.length, color: 'text-foreground' },
    { label: 'Confirmadas', value: reservations.filter(r => r.status === 'confirmed').length, color: 'text-info' },
    { label: 'Pendentes', value: reservations.filter(r => r.status === 'pending').length, color: 'text-warning' },
    { label: 'Canceladas', value: reservations.filter(r => r.status === 'cancelled').length, color: 'text-danger' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Gestão</p>
          <h1 className="font-display text-3xl text-primary">Reservas</h1>
        </div>
        <CreateReservationDialog />
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-surface p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <PhoneReservation />
      <ReservationsTable />
    </div>
  )
}