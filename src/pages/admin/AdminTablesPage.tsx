import { type MouseEvent, useMemo, useState } from 'react'
import { Armchair, Image, Map, Move, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { tableLocationOptions, tableStatusOptions, useVenueStore } from '@/store/venue.store'
import type { Table, TableStatus, VenueArea, VenueAreaShape } from '@/types'

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

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className={cn('text-2xl font-bold', className)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
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

export default function AdminTablesPage() {
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

  const stats = useMemo(() => ({
    occupied: tables.filter((table) => table.status === 'occupied').length,
    reserved: tables.filter((table) => table.status === 'reserved').length,
    available: tables.filter((table) => table.status === 'available').length,
    vip: tables.filter((table) => table.location === 'vip').length,
  }), [tables])

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
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.25em] text-accent">Gestao</p>
        <h1 className="font-display text-3xl text-primary">Mesas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edite o mapa do Palace, estados das mesas, zonas VIP, imagens e detalhes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Ocupadas" value={stats.occupied} className="text-success" />
        <StatCard label="Reservadas" value={stats.reserved} className="text-warning" />
        <StatCard label="Vagas" value={stats.available} className="text-danger" />
        <StatCard label="VIP" value={stats.vip} className="text-accent" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3">
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
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">Areas do mapa</h2>
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
                <h2 className="font-semibold">Mesa {selected.number}</h2>
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
    </div>
  )
}
