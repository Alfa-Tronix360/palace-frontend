import { FormEvent, useMemo, useState } from 'react'
import { Plus, Trophy, UserCog } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { employeesAdapter } from '@/services/adapters/employees.adapter'
import type { EmployeeRole } from '@/types'

const roleLabels: Record<EmployeeRole, string> = {
  attendant: 'Atendente',
  seller: 'Vendedor',
  operator: 'Operador',
}

export default function AdminEmployeesPage() {
  const queryClient = useQueryClient()

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesAdapter.getAll(),
  })

  const { data: employeeOrders = [] } = useQuery({
    queryKey: ['employee-orders'],
    queryFn: () => employeesAdapter.getOrders(),
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<EmployeeRole>('attendant')
  const [tableId, setTableId] = useState('')



  const createEmployeeMutation = useMutation({
    mutationFn: () => employeesAdapter.create({
      name: name.trim(),
      phone: phone.trim(),
      role,
      table_id: tableId ? Number(tableId) : undefined,
    }),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setName('')
      setPhone('')
      setRole('attendant')
      setTableId('')
      toast.success('Funcionario cadastrado.')
    },
    onError: () => toast.error('Erro ao cadastrar funcionario.'),
  })

  const assignTableMutation = useMutation({
    mutationFn: ({ employeeId, tableId }: { employeeId: string; tableId?: string }) =>
      employeesAdapter.assignTable(employeeId, tableId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
    onError: () => toast.error('Erro ao atribuir mesa.'),
  })



  const topEmployees = useMemo(() => {
    return employeeOrders
      .reduce<Array<{ id: string; name: string; total: number; orders: number }>>((acc, order) => {
        const item = acc.find((e) => e.id === order.employeeId)
        if (item) { item.total += order.total; item.orders += 1 }
        else acc.push({ id: order.employeeId, name: order.employeeName, total: order.total, orders: 1 })
        return acc
      }, [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [employeeOrders])

  const topTables = useMemo(() => {
    return employeeOrders
      .reduce<Array<{ id: string; name: string; total: number; orders: number }>>((acc, order) => {
        const item = acc.find((e) => e.id === order.tableId)
        if (item) { item.total += order.total; item.orders += 1 }
        else acc.push({ id: order.tableId, name: `Mesa ${order.tableNumber}`, total: order.total, orders: 1 })
        return acc
      }, [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [employeeOrders])

  function handleRegisterEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !phone.trim()) return
    createEmployeeMutation.mutate()
  }



  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Equipa</p>
        <h1 className="font-display text-3xl text-primary">Funcionarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastre atendentes, atribua mesas e lance pedidos por mesa.</p>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <form onSubmit={handleRegisterEmployee} className="rounded-xl border border-border/40 bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Cadastrar funcionario</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Nome</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Telefone WhatsApp</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Funcao</span>
                <select value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                  {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Mesa atribuida</span>
                <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                  <option value="">Sem mesa fixa</option>
                  {tables.map((t) => <option key={t.id} value={t.id}>Mesa {t.number}</option>)}
                </select>
              </label>
            </div>
            <Button type="submit" disabled={!name.trim() || !phone.trim() || createEmployeeMutation.isPending}>
              <Plus className="h-4 w-4" /> Cadastrar
            </Button>
          </form>



          <div className="rounded-xl border border-border/40 bg-surface">
            <div className="border-b border-border/40 p-5">
              <h2 className="font-semibold">Funcionarios cadastrados</h2>
            </div>
            <div className="divide-y divide-border/40">
              {employees.length ? employees.map((employee) => {
                const table = tables.find((t) => t.id === employee.tableId)
                return (
                  <div key={employee.id} className="grid gap-3 p-4 md:grid-cols-[1fr_180px] md:items-center">
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{roleLabels[employee.role]} | {employee.phone}</p>
                    </div>
                    <select
                      value={employee.tableId || ''}
                      onChange={(e) => assignTableMutation.mutate({ employeeId: employee.id, tableId: e.target.value || undefined })}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                      <option value="">{table ? `Mesa ${table.number}` : 'Sem mesa fixa'}</option>
                      {tables.map((t) => <option key={t.id} value={t.id}>Mesa {t.number}</option>)}
                    </select>
                  </div>
                )
              }) : (
                <div className="p-5 text-sm text-muted-foreground">Ainda nao existem funcionarios cadastrados.</div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <RankingCard title="Top funcionarios" subtitle="Quem mais vendeu" items={topEmployees} />
          <RankingCard title="Mesas que mais rendem" subtitle="Pedidos lancados por mesa" items={topTables} />
        </aside>
      </div>
    </div>
  )
}

function RankingCard({ title, subtitle, items }: { title: string; subtitle: string; items: Array<{ id: string; name: string; total: number; orders: number }> }) {
  return (
    <section className="rounded-xl border border-border/40 bg-surface p-5">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{index + 1}. {item.name}</p>
              <p className="text-sm font-semibold text-primary">{formatCurrency(item.total)}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.orders} pedidos</p>
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