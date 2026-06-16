import { type ColumnDef } from '@tanstack/react-table'
import { Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { paymentsAdapter } from '@/services/adapters/payments.adapter'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import type { Payment } from '@/types'
import { toast } from 'sonner'

const statusColor: Record<string, string> = {
  confirmed: 'bg-success/20 text-success',
  pending: 'bg-warning/20 text-warning',
  failed: 'bg-danger/20 text-danger',
}

export function PaymentsTable() {
  const queryClient = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsAdapter.getAll(),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => paymentsAdapter.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Pagamento confirmado.')
    },
    onError: () => toast.error('Erro ao confirmar pagamento.'),
  })

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'clientName',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-medium">{row.original.clientName}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => (
        <span className="font-semibold" style={{ color: '#B89A67' }}>{formatCurrency(row.original.amount)}</span>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Método',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[row.original.method]}</span>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Referência',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.reference ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.date)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColor[row.original.status])}>
          {PAYMENT_STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        if (p.status !== 'pending') return null
        return (
          <button onClick={() => confirmMutation.mutate(p.id)}
            className="w-7 h-7 rounded flex items-center justify-center bg-success/20 hover:bg-success/30 text-success transition-colors" title="Confirmar">
            <Check className="w-3.5 h-3.5" />
          </button>
        )
      },
      enableSorting: false,
    },
  ]

  if (isLoading) return <div className="text-center py-10 text-muted-foreground text-sm">A carregar pagamentos...</div>

  return (
    <DataTable columns={columns} data={data} searchPlaceholder="Pesquisar pagamentos…" />
  )
}