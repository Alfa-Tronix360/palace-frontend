import { type ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { eventsAdapter } from '@/services/adapters/events.adapter'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { EVENT_TYPE_LABELS, EVENT_STATUS_LABELS } from '@/lib/constants'
import type { Event, EventStatus } from '@/types'
import { toast } from 'sonner'
import { http } from '@/services/api/http'


const statusColors: Record<EventStatus, string> = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-info/20 text-info',
  confirmed: 'bg-success/20 text-success',
  completed: 'bg-primary/20 text-primary',
  cancelled: 'bg-danger/20 text-danger',
}

export function EventsTable() {
  const queryClient = useQueryClient()
  const [detail, setDetail] = useState<Event | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsAdapter.getAll(),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => http.patch(`/events/${id}`, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Evento aprovado.')
      setDetail(null)
    },
    onError: () => toast.error('Erro ao aprovar evento.'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => http.patch(`/events/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Evento cancelado.')
      setDetail(null)
    },
    onError: () => toast.error('Erro ao cancelar evento.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => http.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('Evento eliminado.')
    },
    onError: () => toast.error('Erro ao eliminar evento.'),
  })
  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>,
    },
    {
      accessorKey: 'clientName',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-medium">{row.original.clientName}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">
          {EVENT_TYPE_LABELS[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: 'guests',
      header: 'Convidados',
      cell: ({ row }) => <span className="text-center block">{row.original.guests}</span>,
    },
    {
      accessorKey: 'budget',
      header: 'Orçamento',
      cell: ({ row }) => row.original.budget
        ? <span className="font-medium" style={{ color: '#B89A67' }}>{formatCurrency(row.original.budget)}</span>
        : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColors[row.original.status])}>
          {EVENT_STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const e = row.original
        return (
          <div className="flex gap-1">
            {e.status === 'pending' && (
              <>
                <button onClick={() => approveMutation.mutate(e.id)}
                  className="w-7 h-7 rounded flex items-center justify-center bg-success/20 hover:bg-success/30 text-success transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => cancelMutation.mutate(e.id)}
                  className="w-7 h-7 rounded flex items-center justify-center bg-danger/20 hover:bg-danger/30 text-danger transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => {
              if (confirm(`Apagar evento ${e.code}?`)) {
                deleteMutation.mutate(e.id)
              }
            }}
              className="w-7 h-7 rounded flex items-center justify-center bg-muted hover:bg-danger/20 text-muted-foreground hover:text-danger transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  if (isLoading) return <div className="text-center py-10 text-muted-foreground text-sm">A carregar eventos...</div>

  return (
    <>
      <DataTable columns={columns} data={data} searchPlaceholder="Pesquisar eventos…" />

      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setDetail(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-surface rounded-2xl border border-border p-6">
              <h2 className="font-display text-xl mb-4">Detalhe do Evento</h2>
              <div className="space-y-3 text-sm">
                <p><span className="text-muted-foreground">Cliente:</span> <strong>{detail.clientName}</strong></p>
                <p><span className="text-muted-foreground">Tipo:</span> {EVENT_TYPE_LABELS[detail.type]}</p>
                <p><span className="text-muted-foreground">Data:</span> {formatDate(detail.date)}</p>
                <p><span className="text-muted-foreground">Convidados:</span> {detail.guests}</p>
                {detail.budget && <p><span className="text-muted-foreground">Orçamento:</span> <strong className="text-accent">{formatCurrency(detail.budget)}</strong></p>}
                {detail.notes && <p><span className="text-muted-foreground">Notas:</span> {detail.notes}</p>}
              </div>
              {detail.status === 'pending' && (
                <div className="flex gap-3 mt-5">
                  <button onClick={() => approveMutation.mutate(detail.id)}
                    className="flex-1 py-2 rounded-md text-sm font-medium bg-success/20 text-success hover:bg-success/30 transition-colors">
                    Aprovar
                  </button>
                  <button onClick={() => cancelMutation.mutate(detail.id)}
                    className="flex-1 py-2 rounded-md text-sm font-medium bg-danger/20 text-danger hover:bg-danger/30 transition-colors">
                    Recusar
                  </button>
                </div>
              )}
              <button onClick={() => setDetail(null)}
                className="w-full mt-2 py-2 rounded-md text-sm text-muted-foreground border border-border hover:text-foreground transition-colors">
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}