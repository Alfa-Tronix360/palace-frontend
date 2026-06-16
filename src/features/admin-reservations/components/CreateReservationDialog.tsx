import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsAdapter } from '@/services/adapters/clients.adapter'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { TIME_SLOTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  tableId: z.string().min(1, 'Selecione uma mesa'),
  date: z.string().min(1, 'Selecione uma data'),
  time: z.string().min(1, 'Selecione um horário'),
  guests: z.number().min(1).max(20),
  notes: z.string().max(300).optional(),
})
type FormData = z.infer<typeof schema>

export function CreateReservationDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAdapter.getAll(),
    enabled: open,
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
    enabled: open,
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { guests: 2 },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => reservationsAdapter.create({
      ...data,
      date: new Date(data.date),
      tableId: data.tableId,
      clientId: data.clientId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Reserva criada com sucesso.')
      reset()
      setOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Erro ao criar reserva.')
    },
  })

  const onSubmit = (data: FormData) => createMutation.mutate(data)

  const inputCls = (err: boolean) => cn(
    'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors',
    'placeholder:text-muted-foreground/60 focus:border-primary',
    err ? 'border-danger' : 'border-border'
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90"
        style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
      >
        <Plus className="w-4 h-4" /> Nova Reserva
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-xl">

              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl text-foreground">Nova Reserva</h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/80">Cliente</label>
                  <select {...register('clientId')} className={inputCls(!!errors.clientId)}>
                    <option value="">Selecionar cliente…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.clientId && <p className="text-xs text-danger">{errors.clientId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">Data</label>
                    <input type="date" {...register('date')} className={inputCls(!!errors.date)} />
                    {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">Horário</label>
                    <select {...register('time')} className={inputCls(!!errors.time)}>
                      <option value="">Selecionar…</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">Mesa</label>
                    <select {...register('tableId')} className={inputCls(!!errors.tableId)}>
                      <option value="">Selecionar…</option>
                      {tables.filter(t => t.status === 'available').map(t => (
                        <option key={t.id} value={t.id}>Mesa {t.number} ({t.capacity} pessoas)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/80">Pessoas</label>
                    <input type="number" {...register('guests', { valueAsNumber: true })} min={1} max={20}
                      className={inputCls(!!errors.guests)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/80">Notas (opcional)</label>
                  <textarea {...register('notes')} rows={2} placeholder="Observações especiais…"
                    className={cn(inputCls(false), 'resize-none')} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting || createMutation.isPending}
                    className="flex-1 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#D9D0B5', color: '#181818' }}>
                    {createMutation.isPending ? 'A criar…' : 'Criar Reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}