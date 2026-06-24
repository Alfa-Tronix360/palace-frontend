import { type MouseEvent, type FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import {
  Armchair, CalendarDays, Eye, Image, Map, Plus, Ticket, Trash2, Users,
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
  occupied: 'bg-danger text-white border-danger',
  reserved: 'bg-warning text-background border-warning',
  available: 'bg-success text-white border-success',
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
        'relative min-h-[850px] overflow-hidden rounded-xl border border-border bg-[#1f1f1f]',
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

function VenueMapSection({
  selectedTableId,
  setSelectedTableId,
  selectedAreaId,
  setSelectedAreaId,
}: {
  selectedTableId?: string
  setSelectedTableId: (id: string) => void
  selectedAreaId?: string
  setSelectedAreaId: (id: string) => void
}) {
  const areas = useVenueStore((state) => state.areas)
  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })
  const updateArea = useVenueStore((state) => state.updateArea)
  const updateTable = useVenueStore((state) => state.updateTable)
  const [moving, setMoving] = useState<MoveTarget | null>(null)
  const [resizing, setResizing] = useState<ResizeTarget | null>(null)
  const selected = tables.find((t) => t.id === selectedTableId) ?? tables[0]
  const selectedArea = areas.find((a) => a.id === selectedAreaId) ?? areas[0]

  function moveSelectedTo(x: number, y: number) {
    if (!moving) return
    if (moving.type === 'area') updateArea(moving.id, { x, y })
    else {
      updateTable(moving.id, { x, y })
      refetchTables()
    }
  }

  function resizeAreaTo(x: number, y: number) {
    if (!resizing) return
    const area = areas.find((item) => item.id === resizing.id)
    if (!area) return
    if (resizing.edge === 'right') updateArea(area.id, { width: Math.max(8, Math.min(92 - area.x, x - area.x)) })
    if (resizing.edge === 'bottom') updateArea(area.id, { height: Math.max(8, Math.min(92 - area.y, y - area.y)) })
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

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Mapa do espaço</p>
        <h2 className="font-display text-2xl text-primary">Mesas e Áreas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite o mapa do Palace, estados das mesas, zonas VIP, imagens e detalhes — para montar o layout do evento.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-danger" /> Ocupada</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warning" /> Reservada</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" /> Vaga</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-muted" /> Manutencao</span>
        </div>
        <PalaceMap
          areas={areas}
          tables={tables}
          selectedId={selected?.id}
          selectedAreaId={selectedArea?.id}
          moving={moving}
          resizing={resizing}
          onSelect={(table) => setSelectedTableId(table.id)}
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
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Página Eventos (conteúdo original)
 * ────────────────────────────────────────────────────────────────────────── */
function VenueAreasSection({
  showAreas = true,
  showMesa = true,
  selectedTableId,
  selectedAreaId,
  setSelectedAreaId,
}: {
  showAreas?: boolean
  showMesa?: boolean
  selectedTableId?: string
  selectedAreaId?: string
  setSelectedAreaId?: (id: string) => void
}) {
  const areas = useVenueStore((state) => state.areas)
  const tables = useVenueStore((state) => state.tables)
  const addArea = useVenueStore((state) => state.addArea)
  const updateArea = useVenueStore((state) => state.updateArea)
  const deleteArea = useVenueStore((state) => state.deleteArea)
  const mergeAreas = useVenueStore((state) => state.mergeAreas)
  const addTable = useVenueStore((state) => state.addTable)
  const updateTable = useVenueStore((state) => state.updateTable)
  const [mergeAreaId, setMergeAreaId] = useState('')
  const selected = tables.find((table) => table.id === selectedTableId) ?? tables[0]
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0]

  return (
    <div className="space-y-5 max-h-[700px] overflow-y-auto pr-1">
      {showAreas && (
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
                <select value={selectedArea.id} onChange={(e) => setSelectedAreaId?.(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Nome</span>
                <input value={selectedArea.name} onChange={(e) => updateArea(selectedArea.id, { name: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Forma</span>
                  <select value={selectedArea.shape} onChange={(e) => updateArea(selectedArea.id, { shape: e.target.value as VenueAreaShape })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                    <option value="rectangle">Retangulo</option>
                    <option value="circle">Circulo</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Cor</span>
                  <input type="color" value={selectedArea.color} onChange={(e) => updateArea(selectedArea.id, { color: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background p-1" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Preco do convite nesta area</span>
                <input type="number" min={0} step={1000} value={selectedArea.ticketPrice ?? 25000}
                  onChange={(e) => updateArea(selectedArea.id, { ticketPrice: Number(e.target.value) })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Largura</span>
                  <input type="number" min={8} max={80} value={selectedArea.width}
                    onChange={(e) => updateArea(selectedArea.id, { width: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Altura</span>
                  <input type="number" min={8} max={80} value={selectedArea.height}
                    onChange={(e) => updateArea(selectedArea.id, { height: Number(e.target.value) })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Descricao</span>
                <textarea value={selectedArea.description ?? ''} onChange={(e) => updateArea(selectedArea.id, { description: e.target.value })} rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </label>
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={() => addTable(selectedArea.id)}>
                  <Plus className="h-4 w-4" /> Mesa
                </Button>
                <Button type="button" variant="outline" onClick={() => deleteArea(selectedArea.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                <p className="text-sm font-medium">Unir com outra area</p>
                <select value={mergeAreaId} onChange={(e) => setMergeAreaId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                  <option value="">Escolher area</option>
                  {areas.filter((area) => area.id !== selectedArea.id).map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" disabled={!mergeAreaId}
                  onClick={() => { mergeAreas(selectedArea.id, mergeAreaId); setMergeAreaId('') }} className="w-full">
                  Unir areas
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {showMesa && selected && (
        <section className="rounded-xl border border-border bg-surface p-5">
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
              <select value={selected.status} onChange={(e) => updateTable(selected.id, { status: e.target.value as TableStatus })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                {tableStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Area da mesa</span>
              <select value={selected.areaId ?? ''} onChange={(e) => updateTable(selected.id, { areaId: e.target.value || undefined })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                <option value="">Sem area</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Zona</span>
              <select value={selected.location} onChange={(e) => updateTable(selected.id, { location: e.target.value as Table['location'] })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                {tableLocationOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4" /> Capacidade</span>
              <input type="number" min={1} max={30} value={selected.capacity}
                onChange={(e) => updateTable(selected.id, { capacity: Number(e.target.value) })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium"><Image className="h-4 w-4" /> Imagem / detalhe</span>
              <input value={selected.imageUrl ?? ''} onChange={(e) => updateTable(selected.id, { imageUrl: e.target.value })}
                placeholder="/images/mesa-vip.png"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Descricao</span>
              <textarea value={selected.description ?? ''} onChange={(e) => updateTable(selected.id, { description: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
          </div>
        </section>
      )}
    </div>
  )
}

export default function AdminEventsPage() {
  const queryClient = useQueryClient()
  const { data: apiTables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesAdapter.getAll(),
  })
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(undefined)
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>(undefined)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => http.get<unknown, any[]>('/events'),
  })

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => http.patch(`/published-events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-events'] })
      setEditingEvent(null)
      toast.success('Evento atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar evento.'),
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
  const [priceIndividual, setPriceIndividual] = useState('')
  const [priceTable, setPriceTable] = useState('')
  const [priceTableWithConsumption, setPriceTableWithConsumption] = useState('')
  const [priceBox, setPriceBox] = useState('')
  const [priceBoxWithConsumption, setPriceBoxWithConsumption] = useState('')
  const [priceVipIndividual, setPriceVipIndividual] = useState('')
  const [priceVipTable, setPriceVipTable] = useState('')
  const [priceVipBox, setPriceVipBox] = useState('')

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
      price_individual: Number(priceIndividual) || 0,
      price_table: Number(priceTable) || 0,
      price_table_with_consumption: Number(priceTableWithConsumption) || 0,
      price_box: Number(priceBox) || 0,
      price_box_with_consumption: Number(priceBoxWithConsumption) || 0,
      price_vip_individual: Number(priceVipIndividual) || 0,
      price_vip_table: Number(priceVipTable) || 0,
      price_vip_box: Number(priceVipBox) || 0,
      published: false,
      table_ids: apiTables.map((t) => Number(t.id)).filter((id) => !isNaN(id)),
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

      {/* MAPA NO TOPO */}
      <VenueMapSection
        selectedTableId={selectedTableId}
        setSelectedTableId={setSelectedTableId}
        selectedAreaId={selectedAreaId}
        setSelectedAreaId={setSelectedAreaId}
      />

      {/* AREAS DO MAPA + PUBLICAR FESTA lado a lado */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* AREAS DO MAPA */}
        <VenueAreasSection
          selectedTableId={selectedTableId}
          selectedAreaId={selectedAreaId}
          setSelectedAreaId={setSelectedAreaId}
        />
        {/* PUBLICAR FESTA */}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Individual (Kz)</span>
                <input type="number" min="0" value={priceIndividual} onChange={e => setPriceIndividual(e.target.value)}
                  placeholder="Ex: 5000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Mesa s/ consumo (Kz)</span>
                <input type="number" min="0" value={priceTable} onChange={e => setPriceTable(e.target.value)}
                  placeholder="Ex: 15000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Mesa c/ consumo (Kz)</span>
                <input type="number" min="0" value={priceTableWithConsumption} onChange={e => setPriceTableWithConsumption(e.target.value)}
                  placeholder="Ex: 25000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Box s/ consumo (Kz)</span>
                <input type="number" min="0" value={priceBox} onChange={e => setPriceBox(e.target.value)}
                  placeholder="Ex: 30000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Box c/ consumo (Kz)</span>
                <input type="number" min="0" value={priceBoxWithConsumption} onChange={e => setPriceBoxWithConsumption(e.target.value)}
                  placeholder="Ex: 50000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">VIP Individual (Kz)</span>
                <input type="number" min="0" value={priceVipIndividual} onChange={e => setPriceVipIndividual(e.target.value)}
                  placeholder="Ex: 10000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">VIP Mesa (Kz)</span>
                <input type="number" min="0" value={priceVipTable} onChange={e => setPriceVipTable(e.target.value)}
                  placeholder="Ex: 35000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">VIP Box (Kz)</span>
                <input type="number" min="0" value={priceVipBox} onChange={e => setPriceVipBox(e.target.value)}
                  placeholder="Ex: 60000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>
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

        {/* EVENTOS PUBLICADOS + MESAS */}
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
                        <Button type="button" variant="outline" onClick={() => setEditingEvent(event)}>
                          Editar
                        </Button>
                        <Button type="button" variant="outline"
                          onClick={() => togglePublishMutation.mutate({ id: event.id, published: event.published })}>
                          <Eye className="h-4 w-4" />
                          {event.published ? 'Publicado' : 'Oculto'}
                        </Button>
                        <Button type="button" variant="outline"
                          onClick={() => { if (confirm(`Apagar "${event.title}"?`)) deleteEventMutation.mutate(event.id) }}
                          className="text-danger border-danger/30 hover:bg-danger/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.seats?.sort((a: any, b: any) => a.table_number - b.table_number).map((seat: any) => (
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

      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">Editar Evento</h2>
              <button onClick={() => setEditingEvent(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nome do evento</span>
              <input value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Data</span>
                <input type="date" value={editingEvent.date?.split('T')[0]} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Hora</span>
                <input type="time" value={editingEvent.time} onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Nome do palco</span>
              <input value={editingEvent.stage_label} onChange={e => setEditingEvent({ ...editingEvent, stage_label: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Preço base (Kz)</span>
              <input type="number" min="0" value={editingEvent.base_price} onChange={e => setEditingEvent({ ...editingEvent, base_price: Number(e.target.value) })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Descrição</span>
              <textarea value={editingEvent.description || ''} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={() => setEditingEvent(null)}
                className="flex-1 py-2.5 rounded-md text-sm border border-border hover:bg-secondary transition-colors">
                Cancelar
              </button>
              <Button className="flex-1" onClick={() => updateEventMutation.mutate({
                id: editingEvent.id,
                data: {
                  title: editingEvent.title,
                  date: new Date(`${editingEvent.date?.split('T')[0]}T12:00:00`).toISOString(),
                  time: editingEvent.time,
                  stage_label: editingEvent.stage_label,
                  description: editingEvent.description,
                  base_price: editingEvent.base_price,
                }
              })} disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}