import { type ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { Eye, Star, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { clientsAdapter } from '@/services/adapters/clients.adapter'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import type { User } from '@/types'

export function ClientsTable() {
  const [selected, setSelected] = useState<User | null>(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAdapter.getAll(),
  })

  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsAdapter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente eliminado.')
      setSelected(null)
    },
    onError: () => toast.error('Erro ao eliminar cliente.'),
  })

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: ({ row }) => {
        const c = row.original
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#D9D0B5,#B89A67)', color: '#181818' }}>
              {getInitials(c.name)}
            </div>
            <div>
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.phone}</span>,
    },
    {
      accessorKey: 'reservationCount',
      header: 'Reservas',
      cell: ({ row }) => <span className="text-center block font-medium">{row.original.reservationCount}</span>,
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Gasto',
      cell: ({ row }) => <span className="font-medium" style={{ color: '#B89A67' }}>{formatCurrency(row.original.totalSpent)}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Cliente desde',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'vip',
      header: 'VIP',
      cell: ({ row }) => row.original.vip ? (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'rgba(184,154,103,0.2)', color: '#B89A67' }}>
          <Star className="w-2.5 h-2.5 fill-current" /> VIP
        </span>
      ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setSelected(row.original)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => {
            if (confirm(`Apagar "${row.original.name}"?`)) {
              deleteMutation.mutate(row.original.id)
            }
          }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-danger/30 hover:bg-danger/10 transition-colors text-danger">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ]

  if (isLoading) return <div className="text-center py-10 text-muted-foreground text-sm">A carregar clientes...</div>

  return (
    <>
      <DataTable columns={columns} data={clients} searchPlaceholder="Pesquisar clientes…" />

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-surface border-l border-border h-full overflow-y-auto p-6 shadow-xl">

              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-foreground">Detalhe do Cliente</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
              </div>

              <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: 'linear-gradient(135deg,#D9D0B5,#B89A67)', color: '#181818' }}>
                  {getInitials(selected.name)}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">{selected.name}</p>
                  {selected.vip && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                      style={{ backgroundColor: 'rgba(184,154,103,0.2)', color: '#B89A67' }}>
                      <Star className="w-3 h-3 fill-current" /> Cliente VIP
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Telefone', value: selected.phone },
                  { label: 'Cliente desde', value: formatDate(selected.createdAt) },
                  { label: 'Nº de reservas', value: String(selected.reservationCount) },
                  { label: 'Total gasto', value: formatCurrency(selected.totalSpent), highlight: true },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                    <p className={item.highlight ? 'font-semibold text-accent' : 'text-sm font-medium text-foreground'}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {!selected.vip && (
                <div className="mt-6 p-3 rounded-lg bg-background border border-border">
                  <p className="text-xs text-muted-foreground">
                    Faltam {formatCurrency(Math.max(0, 200000 - selected.totalSpent))} para atingir o estatuto VIP
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (selected.totalSpent / 200000) * 100)}%`, backgroundColor: '#B89A67' }} />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}