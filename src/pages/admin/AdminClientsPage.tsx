import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ClientsTable } from '@/features/admin-clients/components/ClientsTable'
import { clientsAdapter } from '@/services/adapters/clients.adapter'

export default function AdminClientsPage() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAdapter.getAll(),
  })

  const now = new Date()
  const stats = [
    { label: 'Total', value: clients.length, color: 'text-foreground' },
    { label: 'VIP', value: clients.filter(c => c.vip).length, color: 'text-accent' },
    { label: 'Novos este mês', value: clients.filter(c => { const d = new Date(c.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length, color: 'text-success' },
    { label: 'Inativos', value: clients.filter(c => c.reservationCount === 0).length, color: 'text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Gestão</p>
        <h1 className="font-display text-3xl text-primary">Clientes</h1>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-surface p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <ClientsTable />
    </div>
  )
}