import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { ReservationStatusBadge } from './ReservationStatusBadge'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { formatDate } from '@/lib/utils'
import type { Reservation } from '@/types'
import { toast } from 'sonner'

export function ReservationsTable() {
  const queryClient = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsAdapter.getAll(),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => reservationsAdapter.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Reserva confirmada.')
    },
    onError: () => toast.error('Erro ao confirmar reserva.'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reservationsAdapter.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Reserva cancelada.')
    },
    onError: () => toast.error('Erro ao cancelar reserva.'),
  })

  const columns: ColumnDef<Reservation>[] = [
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
      accessorKey: 'tableNumber',
      header: 'Mesa',
      cell: ({ row }) => <span className="text-muted-foreground">Mesa {row.original.tableNumber}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span>,
      sortingFn: (a, b) => new Date(a.original.date).getTime() - new Date(b.original.date).getTime(),
    },
    {
      accessorKey: 'time',
      header: 'Hora',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.time}</span>,
    },
    {
      accessorKey: 'guests',
      header: 'Pessoas',
      cell: ({ row }) => <span className="text-center block">{row.original.guests}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <ReservationStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const r = row.original
        if (r.status !== 'pending') return (
          <span className="w-8 h-8 flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground/40" />
          </span>
        )
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => confirmMutation.mutate(r.id)}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-success/20 hover:bg-success/30 text-success transition-colors" title="Confirmar">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => cancelMutation.mutate(r.id)}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-danger/20 hover:bg-danger/30 text-danger transition-colors" title="Cancelar">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]

  if (isLoading) return <div className="text-center py-10 text-muted-foreground text-sm">A carregar reservas...</div>

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Pesquisar por cliente ou código…"
    />
  )
}