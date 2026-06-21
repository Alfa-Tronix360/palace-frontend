import { type MouseEvent, type FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Armchair, CalendarDays, Eye, Image, Map, Move, Plus, Ticket, Trash2, Users,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EventsTable } from '@/features/admin-events/components/EventsTable'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { http } from '@/services/api/http'
import { tableLocationOptions, tableStatusOptions, useVenueStore } from '@/store/venue.store'
import type { Table, TableStatus, VenueArea, VenueAreaShape } from '@/types'

/* ──────────────────────────────────────────────────────────────────────────
 * Mapa de mesas (movido da antiga página "Mesas")
 * ────────────────────────────────────────────────────────────────────────── */

type MoveTarget = { type: 'area' | 'table'; id: string }
type ResizeEdge = 'left' | 'right' | 'top' | 'bottom'
type ResizeTarget = { id: string; edge: ResizeEdge }

const statusStyles: Record<TableStatus, string> = {
  occupied: 'bg-success text-white border-success',
  reserved: 'bg-warning text-background border-warning',
  available: 'bg-danger text-white border-danger',
  maintenance: 'bg-muted text-muted-foreground border-border',
}

const statusLabels: Record<TableStatus, string> = {
  occupied: 'Ocupada',
  reserved: 'Reservada',
  available: 'Vaga',
  maintenance: 'Manutencao',
}

function clamp(value: number) {
  return Math.min(88, Math.max(8, value))
}

function PalaceMap({
  areas,
  tables,
  selectedId,
  selectedAreaId,
  moving,
  resizing,
  onSelect,
  onSelectArea,
  onStartMove,
  onStartResize,
  onMove,
  onResize,
  onStopMove,
}: {
  areas: VenueArea[]
  tables: Table[]
  selectedId?: string
  selectedAreaId?: string
  moving: MoveTarget | null
  resizing: ResizeTarget | null
  onSelect: (table: Table) => void
  onSelectArea: (area: VenueArea) => void
  onStartMove: (target: MoveTarget) => void
  onStartResize: (target: ResizeTarget) => void
  onMove: (x: number, y: number) => void
  onResize: (x: number, y: number) => void
  onStopMove: () => void
}) {
  function handlePointer(event: MouseEvent<HTMLDivElement>) {
    if (!moving && !resizing) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100)
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100)
    if (resizing) onResize(x, y)
    else onMove(x, y)
  }

  return (
    <div
      className={cn(
        'relative min-h-[560px] overflow-hidden rounded-xl border border-border bg-[#1f1f1f]',
        (moving || resizing) && 'cursor-move ring-2 ring-primary/40'
      )}
      onMouseMove={handlePointer}
      onMouseUp={onStopMove}
      onMouseLeave={onStopMove}
      onClick={() => (moving || resizing) && onStopMove()}
    >
      <div className="absolute inset-x-8 top-6 h-16 rounded-b-3xl border border-accent/50 bg-accent/15 text-center">
        <p className="pt-5 text-xs uppercase tracking-[0.35em] text-accent">Palco / DJ</p>
      </div>

      {areas.map((area) => (
        <div
          key={area.id}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation()
            onSelectArea(area)
          }}
          onDoubleClick={(event) => {
            event.stopPropagation()
            onSelectArea(area)
            onStartMove({ type: 'area', id: area.id })
          }}
          className={cn(
            'absolute border border-dashed p-3 text-left transition-colors hover:border-primary',
            area.shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
            selectedAreaId === area.id && 'ring-2 ring-primary/50'
          )}
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            borderColor: `${area.color}99`,
            backgroundColor: `${area.color}18`,
          }}
        >
          <span className="block text-xs font-medium" style={{ color: area.color }}>{area.name}</span>
          {area.description && <span className="mt-1 block text-[11px] text-muted-foreground">{area.description}</span>}
          {selectedAreaId === area.id && (
            <>
              <span
                className="absolute inset-y-2 left-0 w-3 -translate-x-1/2 cursor-ew-resize rounded-full bg-primary/70"
                onMouseDown={(event) => {
                  event.stopPropagation()
                  onStartResize({ id: area.id, edge: 'left' })
                }}
              />
              <span
                className="absolute inset-y-2 right-0 w-3 translate-x-1/2 cursor-ew-resize rounded-full bg-primary/70"
                onMouseDown={(event) => {
                  event.stopPropagation()
                  onStartResize({ id: area.id, edge: 'right' })
                }}
              />
              <span
                className="absolute inset-x-2 top-0 h-3 -translate-y-1/2 cursor-ns-resize rounded-full bg-primary/70"
                onMouseDown={(event) => {
                  event.stopPropagation()
                  onStartResize({ id: area.id, edge: 'top' })
                }}
              />
              <span
                className="absolute inset-x-2 bottom-0 h-3 translate-y-1/2 cursor-ns-resize rounded-full bg-primary/70"
                onMouseDown={(event) => {
                  event.stopPropagation()
                  onStartResize({ id: area.id, edge: 'bottom' })
                }}
              />
            </>
          )}
        </div>
      ))}

      {tables.map((table) => (
        <button
          key={table.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(table)
          }}
          onDoubleClick={(event) => {
            event.stopPropagation()
            onSelect(table)
            onStartMove({ type: 'table', id: table.id })
          }}
          className={cn(
            'absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform hover:scale-105',
            statusStyles[table.status],
            selectedId === table.id && 'ring-4 ring-primary/40'
          )}
          style={{ left: `${table.x ?? 20}%`, top: `${table.y ?? 40}%` }}
          title={`Mesa ${table.number} - ${statusLabels[table.status]}`}
        >
          {table.number}
        </button>
      ))}
    </div>
  )
}

function VenueMapSection() {
  const areas = useVenueStore((state) => state.areas)
  const tables = useVenueStore((state) => state.tables)
  const addArea = useVenueStore((state) => state.addArea)
  const updateArea = useVenueStore((state) => state.updateArea)
  const deleteArea = useVenueStore((state) => state.deleteArea)
  const mergeAreas = useVenueStore((state) => state.mergeAreas)
  const addTable = useVenueStore((state) => state.addTable)
  const updateTable = useVenueStore((state) => state.updateTable)
  const [selectedId, setSelectedId] = useState(tables[0]?.id)
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.id)
  const [moving, setMoving] = useState<MoveTarget | null>(null)
  const [resizing, setResizing] = useState<ResizeTarget | null>(null)
  const [mergeAreaId, setMergeAreaId] = useState('')
  const selected = tables.find((table) => table.id === selectedId) ?? tables[0]
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0]

  function moveSelectedTo(x: number, y: number) {
    if (!moving) return
    if (moving.type === 'area') updateArea(moving.id, { x, y })
    else updateTable(moving.id, { x, y })
  }

  function resizeAreaTo(x: number, y: number) {
    if (!resizing) return
    const area = areas.find((item) => item.id === resizing.id)
    if (!area) return

    if (resizing.edge === 'right') {
      updateArea(area.id, { width: Math.max(8, Math.min(92 - area.x, x - area.x)) })
    }
    if (resizing.edge === 'bottom') {
      updateArea(area.id, { height: Math.max(8, Math.min(92 - area.y, y - area.y)) })
    }
    if (resizing.edge === 'left') {
      const right = area.x + area.width
      const nextX = Math.min(right - 8, x)
      updateArea(area.id, { x: nextX, width: right - nextX })
    }
    if (resizing.edge === 'top') {
      const bottom = area.y + area.height
      const nextY = Math.min(bottom - 8, y)
      updateArea(area.id, { y: nextY, height: bottom - nextY })
    }
  }

  function stopMapGesture() {
    setMoving(null)
    setResizing(null)
  }

  function handleMergeAreas() {
    if (!selectedArea || !mergeAreaId) return
    mergeAreas(selectedArea.id, mergeAreaId)
    setMergeAreaId('')
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Mapa do espaço</p>
        <h2 className="font-display text-2xl text-primary">Mesas e Áreas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite o mapa do Palace, estados das mesas, zonas VIP, imagens e detalhes — para montar o layout do evento.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" /> Ocupada</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warning" /> Reservada</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-danger" /> Vaga</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted" /> Manutencao</span>
          </div>
          <PalaceMap
            areas={areas}
            tables={tables}
            selectedId={selected?.id}
            selectedAreaId={selectedArea?.id}
            moving={moving}
            resizing={resizing}
            onSelect={(table) => setSelectedId(table.id)}
            onSelectArea={(area) => setSelectedAreaId(area.id)}
            onStartMove={setMoving}
            onStartResize={setResizing}
            onMove={moveSelectedTo}
            onResize={resizeAreaTo}
            onStopMove={stopMapGesture}
          />
          <p className="text-xs text-muted-foreground">
            Clique numa area ou mesa para editar. Duplo clique move com o mouse. Arraste as bordas da area selecionada para aumentar ou diminuir.
          </p>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Areas do mapa</h3>
                  <p className="text-xs text-muted-foreground">Formas geometricas editaveis</p>
                </div>
              </div>
              <Button type="button" size="icon" onClick={addArea} title="Adicionar area">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedArea && (
              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Area selecionada</span>
                  <select
                    value={selectedArea.id}
                    onChange={(event) => setSelectedAreaId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Nome</span>
                  <input
                    value={selectedArea.name}
                    onChange={(event) => updateArea(selectedArea.id, { name: event.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Forma</span>
                    <select
                      value={selectedArea.shape}
                      onChange={(event) => updateArea(selectedArea.id, { shape: event.target.value as VenueAreaShape })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="rectangle">Retangulo</option>
                      <option value="circle">Circulo</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Cor</span>
                    <input
                      type="color"
                      value={selectedArea.color}
                      onChange={(event) => updateArea(selectedArea.id, { color: event.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background p-1"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Preco do convite nesta area</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={selectedArea.ticketPrice ?? 25000}
                    onChange={(event) => updateArea(selectedArea.id, { ticketPrice: Number(event.target.value) })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Largura</span>
                    <input
                      type="number"
                      min={8}
                      max={80}
                      value={selectedArea.width}
                      onChange={(event) => updateArea(selectedArea.id, { width: Number(event.target.value) })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium">Altura</span>
                    <input
                      type="number"
                      min={8}
                      max={80}
                      value={selectedArea.height}
                      onChange={(event) => updateArea(selectedArea.id, { height: Number(event.target.value) })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Descricao</span>
                  <textarea
                    value={selectedArea.description ?? ''}
                    onChange={(event) => updateArea(selectedArea.id, { description: event.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setMoving({ type: 'area', id: selectedArea.id })}>
                    <Move className="h-4 w-4" />
                    Mover area
                  </Button>
                  <Button type="button" className="flex-1" onClick={() => addTable(selectedArea.id)}>
                    <Plus className="h-4 w-4" />
                    Mesa
                  </Button>
                  <Button type="button" variant="outline" onClick={() => deleteArea(selectedArea.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                  <p className="text-sm font-medium">Unir com outra area</p>
                  <select
                    value={mergeAreaId}
                    onChange={(event) => setMergeAreaId(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Escolher area</option>
                    {areas
                      .filter((area) => area.id !== selectedArea.id)
                      .map((area) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                  </select>
                  <Button type="button" variant="outline" disabled={!mergeAreaId} onClick={handleMergeAreas} className="w-full">
                    Unir areas
                  </Button>
                </div>
              </div>
            )}
          </section>

          {selected && (
            <aside className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Armchair className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Mesa {selected.number}</h3>
                  <p className="text-xs text-muted-foreground">Capacidade {selected.capacity} pessoas</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Estado</span>
                  <select
                    value={selected.status}
                    onChange={(event) => updateTable(selected.id, { status: event.target.value as TableStatus })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {tableStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Area da mesa</span>
                  <select
                    value={selected.areaId ?? ''}
                    onChange={(event) => updateTable(selected.id, { areaId: event.target.value || undefined })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Sem area</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Zona</span>
                  <select
                    value={selected.location}
                    onChange={(event) => updateTable(selected.id, { location: event.target.value as Table['location'] })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {tableLocationOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" /> Capacidade</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={selected.capacity}
                    onChange={(event) => updateTable(selected.id, { capacity: Number(event.target.value) })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-sm font-medium"><Image className="h-4 w-4" /> Imagem / detalhe</span>
                  <input
                    value={selected.imageUrl ?? ''}
                    onChange={(event) => updateTable(selected.id, { imageUrl: event.target.value })}
                    placeholder="/images/mesa-vip.png"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Descricao</span>
                  <textarea
                    value={selected.description ?? ''}
                    onChange={(event) => updateTable(selected.id, { description: event.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>

                <Button type="button" variant="outline" onClick={() => setMoving({ type: 'table', id: selected.id })}>
                  <Move className="h-4 w-4" />
                  Mover mesa com mouse
                </Button>
              </div>
            </aside>
          )}
        </aside>
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Página Eventos (conteúdo original)
 * ────────────────────────────────────────────────────────────────────────── */

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

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [basePrice, setBasePrice] = useState('')

  async function uploadBanner(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'palace_lounge')
    const res = await fetch('https://api.cloudinary.com/v1_1/dkcq4gtxp/image/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url
  }

  const createEventMutation = useMutation({
    mutationFn: (finalBannerUrl?: string) => http.post('/published-events', {
      title,
      date: new Date(`${date}T12:00:00`).toISOString(),
      time,
      stage_label: stageLabel,
      description,
      banner_url: finalBannerUrl || undefined,
      base_price: Number(basePrice) || 0,
      published: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-events'] })
      setTitle(''); setDate(''); setTime('21:00')
      setStageLabel('Palco principal'); setDescription('')
      setBannerUrl(''); setBannerFile(null); setBannerPreview(''); setBasePrice('')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => http.delete(`/published-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-events'] })
      toast.success('Evento eliminado.')
    },
    onError: () => toast.error('Erro ao eliminar evento.'),
  })

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      http.post(published ? `/published-events/${id}/unpublish` : `/published-events/${id}/publish`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['published-events'] }),
  })

  // DEPOIS
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title || !date) return

    let finalBannerUrl = bannerUrl

    if (bannerFile) {
      setUploadingBanner(true)
      try {
        finalBannerUrl = await uploadBanner(bannerFile)
      } catch {
        setUploadingBanner(false)
        return
      }
      setUploadingBanner(false)
    }

    createEventMutation.mutate(finalBannerUrl)
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

      <VenueMapSection />

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
            <span className="text-sm font-medium">Preço base (Kz)</span>
            <input type="number" min="0" value={basePrice} onChange={e => setBasePrice(e.target.value)}
              placeholder="Ex: 15000"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>


          <label className="block space-y-2">
            <span className="text-sm font-medium">Imagem do evento</span>
            <input type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)) }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            {bannerPreview && (
              <img src={bannerPreview} alt="Preview" className="mt-2 h-32 w-full rounded-md object-cover" />
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Descricao</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>


          <Button type="submit" disabled={!title || !date || createEventMutation.isPending || uploadingBanner} className="w-full">
            <Ticket className="h-4 w-4" />
            {uploadingBanner ? 'A carregar imagem...' : createEventMutation.isPending ? 'A publicar...' : 'Publicar evento'}
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
                      <div className="flex gap-2">
                        <Button type="button" variant="outline"
                          onClick={() => togglePublishMutation.mutate({ id: event.id, published: event.published })}>
                          <Eye className="h-4 w-4" />
                          {event.published ? 'Publicado' : 'Oculto'}
                        </Button>
                        <Button type="button" variant="outline"
                          onClick={() => {
                            if (confirm(`Apagar "${event.title}"?`)) {
                              deleteEventMutation.mutate(event.id)
                            }
                          }}
                          className="text-danger border-danger/30 hover:bg-danger/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
