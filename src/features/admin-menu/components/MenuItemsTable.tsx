import { type ColumnDef } from '@tanstack/react-table'
import { ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/DataTable'
import { menuAdapter } from '@/services/adapters/menu.adapter'
import { formatCurrency, cn } from '@/lib/utils'
import { MENU_CATEGORY_LABELS } from '@/lib/constants'
import type { MenuItem } from '@/types'
import { toast } from 'sonner'

export function MenuItemsTable() {
  const queryClient = useQueryClient()

  const { data = [], isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuAdapter.getAll(),
  })

  const toggleMutation = useMutation({
    mutationFn: (item: MenuItem) => menuAdapter.update(item.id, { available: !item.available }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      toast.success(`"${updated.name}" marcado como ${updated.available ? 'disponível' : 'indisponível'}.`)
    },
    onError: () => toast.error('Erro ao atualizar disponibilidade.'),
  })

  const columns: ColumnDef<MenuItem>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {row.original.imageUrl
              ? <img src={row.original.imageUrl} alt={row.original.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-secondary" />
            }
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{row.original.name}</p>
            {row.original.featured && (
              <span className="text-[10px] font-medium" style={{ color: '#B89A67' }}>Destaque</span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded">
          {MENU_CATEGORY_LABELS[row.original.category]}
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => (
        <span className="font-semibold" style={{ color: '#B89A67' }}>{formatCurrency(row.original.price)}</span>
      ),
    },
    {
      accessorKey: 'available',
      header: 'Disponível',
      cell: ({ row }) => (
        <button
          onClick={() => toggleMutation.mutate(row.original)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium transition-colors',
            row.original.available ? 'text-success' : 'text-muted-foreground'
          )}
        >
          {row.original.available
            ? <ToggleRight className="w-5 h-5" />
            : <ToggleLeft className="w-5 h-5" />
          }
          {row.original.available ? 'Sim' : 'Não'}
        </button>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
      enableSorting: false,
    },
  ]

  if (isLoading) return <div className="text-center py-10 text-muted-foreground text-sm">A carregar cardápio...</div>

  return (
    <DataTable columns={columns} data={data} searchPlaceholder="Pesquisar itens do cardápio…" />
  )
}