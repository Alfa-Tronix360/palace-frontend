import { motion } from 'framer-motion'
import { FormEvent, useState } from 'react'
import { CalendarDays, Eye, Ticket } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EventsTable } from '@/features/admin-events/components/EventsTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { http } from '@/services/api/http'

export default function AdminEventsPage() {
  const queryClient = useQueryClient()

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => http.get<unknown, any[]>('/events'),
  })

  const { data: publishedEvents = [] } = useQuery({
    queryKey: ['published-events'],
    queryFn: () => http.get<unknown, any[]>('/published-events'),
  })

  const stats = [
    { label: 'Total', value: events.length, color: 'text-foreground' },
    { label: 'Pendentes', value: events.filter((e: any) => e.status === 'pending').length, color: 'text-warning' },
    { label: 'Aprovados', value: events.filter((e: any) => e.status === 'approved').length, color: 'text-info' },
    { label: 'Concluídos', value: events.filter((e: any) => e.status === 'completed').length, color: 'text-success' },
  ]

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('21:00')
  const [stageLabel, setStageLabel] = useState('Palco principal')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  const createEventMutation = useMutation({
    mutationFn: () => http.post('/published-events', {
      title,
      date: new Date(`${date}T12:00:00`).toISOString(),
      time,
      stage_label: stageLabel,
      description,
      banner_url: bannerUrl || undefined,
      base_price: 0,
      published: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-events'] })
      setTitle(''); setDate(''); setTime('21:00')
      setStageLabel('Palco principal'); setDescription(''); setBannerUrl('')
    },
  })

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      http.post(published ? `/published-events/${id}/unpublish` : `/published-events/${id}/publish`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['published-events'] }),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title || !date) return
    createEventMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Gestão</p>
        <h1 className="font-display text-3xl text-primary">Eventos</h1>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-surface p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <EventsTable />

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Bilheteira</p>
            <h2 className="font-display text-2xl text-primary">Publicar festa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O mapa de convites sera criado com base nas mesas configuradas.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Nome do evento</span>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Noite Palace Sunset"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Data</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Hora</span>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Nome do palco</span>
            <input value={stageLabel} onChange={e => setStageLabel(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Imagem do evento</span>
            <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="/images/evento.png"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Descricao</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>

          <Button type="submit" disabled={!title || !date || createEventMutation.isPending} className="w-full">
            <Ticket className="h-4 w-4" />
            {createEventMutation.isPending ? 'A publicar...' : 'Publicar evento'}
          </Button>
        </form>

        <div className="space-y-3">
          <h2 className="font-display text-2xl text-primary">Eventos publicados</h2>
          {publishedEvents.length ? (
            <div className="grid gap-3">
              {publishedEvents.map((event: any) => {
                const sold = event.seats?.filter((s: any) => s.status === 'sold').length ?? 0
                const available = event.seats?.filter((s: any) => s.status === 'available').length ?? 0
                return (
                  <article key={event.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {formatDate(new Date(event.date))} as {event.time}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {available} lugares disponiveis | {sold} vendidos
                        </p>
                      </div>
                      <Button type="button" variant="outline"
                        onClick={() => togglePublishMutation.mutate({ id: event.id, published: event.published })}>
                        <Eye className="h-4 w-4" />
                        {event.published ? 'Publicado' : 'Oculto'}
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.seats?.slice(0, 8).map((seat: any) => (
                        <span key={seat.id} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                          Mesa {seat.table_number}: {formatCurrency(seat.price)}
                        </span>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
              Nenhuma festa publicada ainda.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}