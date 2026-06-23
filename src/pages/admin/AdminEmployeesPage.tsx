import { FormEvent, useMemo, useState } from 'react'
import { Plus, Trophy, UserCog } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { employeesAdapter } from '@/services/adapters/employees.adapter'
import type { EmployeeRole } from '@/types'

const roleLabels: Record<EmployeeRole, string> = {
  attendant: 'Atendente',
  seller: 'Vendedor',
  operator: 'Operador',
}

export default function AdminEmployeesPage() {
  const queryClient = useQueryClient()


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
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null)



  const createEmployeeMutation = useMutation({
    mutationFn: () => employeesAdapter.create({
      name: name.trim(),
      phone: phone.trim(),
      role,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setName('')
      setPhone('')
      setRole('attendant')
      toast.success('Funcionario cadastrado.')
    },
    onError: () => toast.error('Erro ao cadastrar funcionario.'),
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
            </div>


            <Button type="submit" disabled={!name.trim() || !phone.trim() || createEmployeeMutation.isPending}>
              <Plus className="h-4 w-4" /> Cadastrar
            </Button>
          </form>

          <div className="rounded-xl border border-border/40 bg-surface">
            <div className="border-b border-border/40 p-5">
              <h2 className="font-semibold">Lista dos Funcionarios cadastrados</h2>
            </div>
            <div className="divide-y divide-border/40">
              {employees.length ? employees.map((employee) => (
                <div key={employee.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setEditingEmployee(employee)}>
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{roleLabels[employee.role]} | {employee.phone}</p>
                    {employee.assignedTables && employee.assignedTables.length > 0 && (
                      <p className="text-xs text-accent mt-0.5">
                        {employee.assignedTables.length} mesa(s): {employee.assignedTables.map((at) => `Mesa ${at.tableNumber}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Editar →</span>
                </div>
              )) : (
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
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">Editar Funcionario</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nome</span>
              <input value={editingEmployee.name} onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Telefone</span>
              <input value={editingEmployee.phone} onChange={e => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Funcao</span>
              <select value={editingEmployee.role} onChange={e => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => setEditingEmployee(null)}
                className="flex-1 py-2.5 rounded-md text-sm border border-border hover:bg-secondary transition-colors">
                Fechar
              </button>
              <Button className="flex-1" onClick={async () => {
                await employeesAdapter.assignTable(editingEmployee.id, editingEmployee.tableId)
                queryClient.invalidateQueries({ queryKey: ['employees'] })
                setEditingEmployee(null)
                toast.success('Funcionario atualizado.')
              }}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
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