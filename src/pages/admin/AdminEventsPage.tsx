import { motion } from 'framer-motion'
import { FormEvent, useState } from 'react'
import { CalendarDays, Eye, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventsTable } from '@/features/admin-events/components/EventsTable'
import { mockEvents }  from '@/data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useVenueStore } from '@/store/venue.store'


const stats = [
  { label: 'Total',      value: mockEvents.length,                                        color: 'text-foreground' },
  { label: 'Pendentes',  value: mockEvents.filter(e => e.status === 'pending').length,    color: 'text-warning' },
  { label: 'Aprovados',  value: mockEvents.filter(e => e.status === 'approved').length,   color: 'text-info' },
  { label: 'Concluídos', value: mockEvents.filter(e => e.status === 'completed').length,  color: 'text-success' },
]

export default function AdminEventsPage() {
  const publishedEvents = useVenueStore((state) => state.publishedEvents)
  const createPublishedEvent = useVenueStore((state) => state.createPublishedEvent)
  const toggleEventPublished = useVenueStore((state) => state.toggleEventPublished)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('21:00')
  const [stageLabel, setStageLabel] = useState('Palco principal')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title || !date) return

    createPublishedEvent({
      title,
      date: new Date(`${date}T12:00:00`),
      time,
      stageLabel,
      description,
      bannerUrl: bannerUrl || undefined,
    })
    setTitle('')
    setDate('')
    setTime('21:00')
    setStageLabel('Palco principal')
    setDescription('')
    setBannerUrl('')
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
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Noite Palace Sunset"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Data</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Hora</span>
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Nome do palco</span>
            <input
              value={stageLabel}
              onChange={(event) => setStageLabel(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Imagem do evento</span>
            <input
              value={bannerUrl}
              onChange={(event) => setBannerUrl(event.target.value)}
              placeholder="/images/evento.png"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Descricao</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <Button type="submit" disabled={!title || !date} className="w-full">
            <Ticket className="h-4 w-4" />
            Publicar evento
          </Button>
        </form>

        <div className="space-y-3">
          <h2 className="font-display text-2xl text-primary">Eventos publicados</h2>
          {publishedEvents.length ? (
            <div className="grid gap-3">
              {publishedEvents.map((event) => {
                const sold = event.seats.filter((seat) => seat.status === 'sold').length
                const available = event.seats.filter((seat) => seat.status === 'available').length
                return (
                  <article key={event.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {formatDate(event.date)} as {event.time}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {available} lugares disponiveis | {sold} vendidos
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => toggleEventPublished(event.id)}>
                        <Eye className="h-4 w-4" />
                        {event.published ? 'Publicado' : 'Oculto'}
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.seats.slice(0, 8).map((seat) => (
                        <span key={seat.id} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                          Mesa {seat.tableNumber}: {formatCurrency(seat.price)}
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
