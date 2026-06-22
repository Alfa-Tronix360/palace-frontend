import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { useVenueStore } from '@/store/venue.store'
import { http } from '@/services/api/http'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TableStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusBadgeStyles: Record<TableStatus, string> = {
  occupied: 'bg-success/15 text-success',
  reserved: 'bg-warning/15 text-warning',
  available: 'bg-danger/15 text-danger',
  maintenance: 'bg-muted text-muted-foreground',
}

const statusLabels: Record<TableStatus, string> = {
  occupied: 'Ocupada',
  reserved: 'Reservada',
  available: 'Vaga',
  maintenance: 'Manutenção',
}

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className={cn('text-2xl font-bold', className)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function AdminTablesPage() {
  const tables = useVenueStore((state) => state.tables)
  const removeTable = useVenueStore((state) => state.removeTable)

  const stats = useMemo(() => ({
    occupied: tables.filter((t) => t.status === 'occupied').length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    available: tables.filter((t) => t.status === 'available').length,
    vip: tables.filter((t) => t.location === 'vip').length,
  }), [tables])

  const sortedTables = useMemo(
    () => [...tables].sort((a, b) => a.number - b.number),
    [tables]
  )

  async function handleDelete(id: string, number: number, status: TableStatus) {
    if (status !== 'available') {
      toast.error('Só é possível apagar mesas vagas.')
      return
    }
    if (!confirm(`Apagar Mesa ${number}?`)) return
    try {
      await http.delete(`/venue/tables/${id}`)
      removeTable(id)
      toast.success(`Mesa ${number} apagada.`)
    } catch {
      toast.error('Erro ao apagar mesa.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-accent">Gestao</p>
        <h1 className="font-display text-3xl text-primary">Mesas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral do estado atual das mesas do Palace. A edição do mapa e dos detalhes de cada mesa está agora na página de Eventos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Ocupadas" value={stats.occupied} className="text-success" />
        <StatCard label="Reservadas" value={stats.reserved} className="text-warning" />
        <StatCard label="Vagas" value={stats.available} className="text-danger" />
        <StatCard label="VIP" value={stats.vip} className="text-accent" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Mesa</th>
              <th className="px-4 py-3">Lugares</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedTables.map((table) => (
              <tr key={table.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">Mesa {table.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{table.capacity}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusBadgeStyles[table.status])}>
                    {statusLabels[table.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {table.status === 'available' && (
                    <button
                      onClick={() => handleDelete(table.id, table.number, table.status)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-danger/30 hover:bg-danger/10 transition-colors text-danger"
                      title="Apagar mesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}