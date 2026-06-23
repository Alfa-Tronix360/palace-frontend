import { FormEvent, useMemo, useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useVenueStore } from '@/store/venue.store'
import { http } from '@/services/api/http'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { employeesAdapter } from '@/services/adapters/employees.adapter'
import { toast } from 'sonner'
import type { TableStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusBadgeStyles: Record<TableStatus, string> = {
  occupied: 'bg-danger/15 text-danger',
  reserved: 'bg-warning/15 text-warning',
  available: 'bg-success/15 text-success',
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
  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAdapter.getAll(),
  })

  const { data: apiTables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })

  const [orderEmployeeId, setOrderEmployeeId] = useState('')
  const [orderTableId, setOrderTableId] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState(0)
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null)

  const createOrderMutation = useMutation({
    mutationFn: () => employeesAdapter.createOrder({
      employeeId: orderEmployeeId,
      tableId: orderTableId,
      items: [{ name: itemName.trim(), quantity, price }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-orders'] })
      setItemName('')
      setQuantity(1)
      setPrice(0)
      toast.success('Pedido lancado na mesa.')
    },
    onError: () => toast.error('Nao foi possivel lancar o pedido.'),
  })

  const toggleTableMutation = useMutation({
    mutationFn: ({ employeeId, tableId }: { employeeId: string; tableId: string }) =>
      employeesAdapter.toggleTable(employeeId, tableId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: () => toast.error('Erro ao atribuir mesa.'),
  })

  function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!orderEmployeeId || !orderTableId || !itemName.trim() || quantity <= 0 || price <= 0) return
    const tableIds = orderTableId.split(',').filter(Boolean)
    tableIds.forEach((tableId) => {
      employeesAdapter.createOrder({
        employeeId: orderEmployeeId,
        tableId,
        items: [{ name: itemName.trim(), quantity, price }],
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['employee-orders'] })
      })
    })
    setItemName('')
    setQuantity(1)
    setPrice(0)
    setOrderTableId('')
    toast.success('Pedido lancado nas mesas.')
  }

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

      <form onSubmit={handleCreateOrder} className="rounded-xl border border-border/40 bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Administrar Mesas</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Funcionario</span>
            <select value={orderEmployeeId} onChange={(e) => {
              const emp = employees.find((item) => item.id === e.target.value)
              setOrderEmployeeId(e.target.value)
              setOrderTableId(emp?.tableId || apiTables[0]?.id || '')
            }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
              <option value="">Selecione</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </label>
          <div className="block space-y-2 md:col-span-2">
            <span className="text-sm font-medium">Mesas</span>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-input rounded-md p-3 bg-background">
              {apiTables.map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={t.id}
                    checked={orderTableId.split(',').includes(t.id)}
                    onChange={(e) => {
                      const ids = orderTableId ? orderTableId.split(',') : []
                      if (e.target.checked) {
                        setOrderTableId([...ids, t.id].join(','))
                      } else {
                        setOrderTableId(ids.filter((id) => id !== t.id).join(','))
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="text-sm">Mesa {t.number}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Produto/servico</span>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Qtd.</span>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Preco</span>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
          </div>
        </div>
        <Button type="submit" disabled={!orderEmployeeId || !orderTableId || !itemName.trim() || price <= 0 || createOrderMutation.isPending}>
          <Plus className="h-4 w-4" /> Lançar Pedido
        </Button>
      </form>

      <div className="rounded-xl border border-border/40 bg-surface">
        <div className="border-b border-border/40 p-5">
          <h2 className="font-semibold">Funcionarios e Mesas Atribuidas</h2>
        </div>
        <div className="divide-y divide-border/40">
          {employees.length ? employees.map((employee) => (
            <div key={employee.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => setEditingEmployee(employee)}>
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-muted-foreground">{employee.phone}</p>
                {employee.assignedTables && employee.assignedTables.length > 0 && (
                  <p className="text-xs text-accent mt-0.5">
                    {employee.assignedTables.length} mesa(s): {employee.assignedTables.map((at) => `Mesa ${at.tableNumber}`).join(', ')}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Editar →</span>
            </div>
          )) : (
            <div className="p-5 text-sm text-muted-foreground">Nenhum funcionario cadastrado.</div>
          )}
        </div>
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">{editingEmployee.name}</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <p className="text-sm text-muted-foreground">{editingEmployee.phone}</p>
            <div className="space-y-2">
              <span className="text-sm font-medium">Mesas atribuidas</span>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {apiTables.map((t) => {
                  const assigned = editingEmployee.assignedTables?.some((at: any) => at.tableId === t.id)
                  return (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!assigned}
                        onChange={() => {
                          const updated = assigned
                            ? editingEmployee.assignedTables.filter((at: any) => at.tableId !== t.id)
                            : [...(editingEmployee.assignedTables || []), { tableId: t.id, tableNumber: t.number }]
                          setEditingEmployee({ ...editingEmployee, assignedTables: updated })
                          toggleTableMutation.mutate({ employeeId: editingEmployee.id, tableId: t.id })
                        }}
                        className="rounded border-border" />
                      <span className="text-sm">Mesa {t.number}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <button onClick={() => setEditingEmployee(null)}
              className="w-full py-2.5 rounded-md text-sm border border-border hover:bg-secondary transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}