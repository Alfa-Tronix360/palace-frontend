import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockTables } from '@/data/mock-tables'
import type {
  DigitalTicket,
  PublishedEvent,
  Reservation,
  Table,
  TableLocation,
  TableStatus,
  TicketSeat,
  User,
  VenueArea,
} from '@/types'

type VenueTableUpdate = Partial<Pick<Table, 'areaId' | 'capacity' | 'description' | 'imageUrl' | 'location' | 'priceTier' | 'status' | 'x' | 'y'>>
type VenueAreaUpdate = Partial<Omit<VenueArea, 'id'>>

interface CreatePublishedEventInput {
  title: string
  date: Date
  time: string
  description: string
  stageLabel: string
  bannerUrl?: string
}

interface VenueState {
  areas: VenueArea[]
  tables: Table[]
  publishedEvents: PublishedEvent[]
  tickets: DigitalTicket[]
  walkInClients: User[]
  walkInReservations: Reservation[]
  addArea: () => void
  updateArea: (id: string, data: VenueAreaUpdate) => void
  deleteArea: (id: string) => void
  mergeAreas: (primaryId: string, secondaryId: string) => void
  addTable: (areaId?: string) => void
  updateTable: (id: string, data: VenueTableUpdate) => void
  registerWalkInClient: (data: { name: string; email?: string; phone: string }) => User
  reserveTableForWalkIn: (data: { clientId: string; tableId: string; guests: number; time: string; notes?: string; occupyNow?: boolean }) => Reservation
  occupyTable: (tableId: string) => void
  releaseTable: (tableId: string) => void
  createPublishedEvent: (data: CreatePublishedEventInput) => void
  toggleEventPublished: (id: string) => void
  buyTicket: (eventId: string, seatId: string, clientId: string, clientName: string) => DigitalTicket
  validateTicket: (qrCode: string) => { ok: boolean; message: string; ticket?: DigitalTicket; event?: PublishedEvent }
}

const initialAreas: VenueArea[] = [
  { id: 'area-vip', name: 'Zona VIP', shape: 'rectangle', x: 5, y: 24, width: 22, height: 58, color: '#D9D0B5', ticketPrice: 60000, description: 'Mesas premium e vista frontal.' },
  { id: 'area-main', name: 'Sala principal', shape: 'rectangle', x: 30, y: 24, width: 42, height: 58, color: '#A89A85', ticketPrice: 35000, description: 'Area central do Palace.' },
  { id: 'area-outdoor', name: 'Exterior', shape: 'rectangle', x: 75, y: 28, width: 18, height: 50, color: '#4A7CC7', ticketPrice: 25000, description: 'Zona exterior.' },
]

const positions = [
  [18, 24], [34, 24], [50, 24], [66, 24],
  [22, 44], [40, 44], [58, 44], [76, 44],
  [18, 66], [36, 66], [54, 66], [72, 66],
]

const initialTables: Table[] = mockTables.map((table, index) => ({
  ...table,
  x: positions[index]?.[0] ?? 20,
  y: positions[index]?.[1] ?? 40,
  areaId: table.location === 'vip' ? 'area-vip' : table.location === 'outdoor' ? 'area-outdoor' : 'area-main',
  priceTier: table.location === 'vip' ? 'vip' : table.location === 'outdoor' ? 'premium' : 'standard',
  description: table.description ?? `Mesa ${table.number} do Palace Lounge`,
}))

function buildSeats(tables: Table[], areas: VenueArea[]): TicketSeat[] {
  return tables
    .filter((table) => table.status !== 'maintenance')
    .map((table) => ({
      id: `seat-${table.id}-${Date.now()}`,
      tableId: table.id,
          tableNumber: table.number,
          x: table.x ?? 20,
          y: table.y ?? 40,
      capacity: table.capacity,
      location: table.location,
      price: areas.find((area) => area.id === table.areaId)?.ticketPrice ?? 25000,
      status: table.status === 'available' ? 'available' : 'blocked',
    }))
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set, get) => ({
      areas: initialAreas,
      tables: initialTables,
      publishedEvents: [],
      tickets: [],
      walkInClients: [],
      walkInReservations: [],

      addArea: () =>
        set((state) => ({
          areas: [
            ...state.areas,
            {
              id: `area-${Date.now()}`,
              name: `Area ${state.areas.length + 1}`,
              shape: 'rectangle',
              x: 12,
              y: 30,
              width: 24,
              height: 28,
              color: '#B89A67',
              ticketPrice: 25000,
            },
          ],
        })),

      updateArea: (id, data) =>
        set((state) => ({
          areas: state.areas.map((area) => (area.id === id ? { ...area, ...data } : area)),
        })),

      deleteArea: (id) =>
        set((state) => ({
          areas: state.areas.filter((area) => area.id !== id),
          tables: state.tables.map((table) => (table.areaId === id ? { ...table, areaId: undefined } : table)),
        })),

      mergeAreas: (primaryId, secondaryId) =>
        set((state) => {
          if (primaryId === secondaryId) return state
          const primary = state.areas.find((area) => area.id === primaryId)
          const secondary = state.areas.find((area) => area.id === secondaryId)
          if (!primary || !secondary) return state

          const left = Math.min(primary.x, secondary.x)
          const top = Math.min(primary.y, secondary.y)
          const right = Math.max(primary.x + primary.width, secondary.x + secondary.width)
          const bottom = Math.max(primary.y + primary.height, secondary.y + secondary.height)

          return {
            areas: state.areas
              .filter((area) => area.id !== secondaryId)
              .map((area) =>
                area.id === primaryId
                  ? {
                      ...area,
                      name: `${primary.name} + ${secondary.name}`,
                      x: left,
                      y: top,
                      width: Math.min(88, right - left),
                      height: Math.min(88, bottom - top),
                      ticketPrice: Math.max(primary.ticketPrice ?? 0, secondary.ticketPrice ?? 0),
                      description: [primary.description, secondary.description].filter(Boolean).join(' | '),
                    }
                  : area
              ),
            tables: state.tables.map((table) =>
              table.areaId === secondaryId ? { ...table, areaId: primaryId } : table
            ),
          }
        }),

      addTable: (areaId) =>
        set((state) => {
          const area = state.areas.find((item) => item.id === areaId)
          const maxNumber = state.tables.reduce((max, table) => Math.max(max, table.number), 0)
          return {
            tables: [
              ...state.tables,
              {
                id: `t-${Date.now()}`,
                number: maxNumber + 1,
                capacity: 4,
                location: 'indoor',
                status: 'available',
                areaId,
                x: area ? area.x + area.width / 2 : 50,
                y: area ? area.y + area.height / 2 : 50,
                priceTier: 'standard',
                description: `Mesa ${maxNumber + 1}`,
              },
            ],
          }
        }),

      updateTable: (id, data) =>
        set((state) => ({
          tables: state.tables.map((table) => (table.id === id ? { ...table, ...data } : table)),
        })),

      registerWalkInClient: (data) => {
        const client: User = {
          id: `walkin-${Date.now()}`,
          name: data.name,
          email: data.email || `cliente-${Date.now()}@walkin.local`,
          phone: data.phone,
          role: 'client',
          vip: false,
          totalSpent: 0,
          reservationCount: 0,
          createdAt: new Date(),
        }

        set((state) => ({
          walkInClients: [client, ...state.walkInClients],
        }))

        return client
      },

      reserveTableForWalkIn: (data) => {
        const table = get().tables.find((item) => item.id === data.tableId)
        const client = get().walkInClients.find((item) => item.id === data.clientId)
        if (!table || !client) throw new Error('Cliente ou mesa invalida')
        if (table.status !== 'available') throw new Error('Mesa indisponivel')

        const reservation: Reservation = {
          id: `op-res-${Date.now()}`,
          code: `OP-${String(get().walkInReservations.length + 1).padStart(3, '0')}`,
          clientId: client.id,
          clientName: client.name,
          tableId: table.id,
          tableNumber: table.number,
          date: new Date(),
          time: data.time,
          guests: data.guests,
          status: data.occupyNow ? 'in_service' : 'confirmed',
          notes: data.notes,
          createdAt: new Date(),
        }

        set((state) => ({
          walkInReservations: [reservation, ...state.walkInReservations],
          walkInClients: state.walkInClients.map((item) =>
            item.id === client.id ? { ...item, reservationCount: item.reservationCount + 1 } : item
          ),
          tables: state.tables.map((item) =>
            item.id === table.id ? { ...item, status: data.occupyNow ? 'occupied' : 'reserved' } : item
          ),
        }))

        return reservation
      },

      occupyTable: (tableId) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, status: 'occupied' } : table
          ),
          walkInReservations: state.walkInReservations.map((reservation) =>
            reservation.tableId === tableId && reservation.status === 'confirmed'
              ? { ...reservation, status: 'in_service' }
              : reservation
          ),
        })),

      releaseTable: (tableId) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId ? { ...table, status: 'available' } : table
          ),
          walkInReservations: state.walkInReservations.map((reservation) =>
            reservation.tableId === tableId && (reservation.status === 'confirmed' || reservation.status === 'in_service')
              ? { ...reservation, status: 'completed' }
              : reservation
          ),
        })),

      createPublishedEvent: (data) =>
        set((state) => ({
          publishedEvents: [
            {
              ...data,
              id: `pe-${Date.now()}`,
              basePrice: 0,
              published: true,
              seats: buildSeats(state.tables, state.areas),
              createdAt: new Date(),
            },
            ...state.publishedEvents,
          ],
        })),

      toggleEventPublished: (id) =>
        set((state) => ({
          publishedEvents: state.publishedEvents.map((event) =>
            event.id === id ? { ...event, published: !event.published } : event
          ),
        })),

      buyTicket: (eventId, seatId, clientId, clientName) => {
        const event = get().publishedEvents.find((item) => item.id === eventId)
        const seat = event?.seats.find((item) => item.id === seatId)
        if (!event || !seat || seat.status !== 'available') {
          throw new Error('Lugar indisponivel')
        }

        const ticket: DigitalTicket = {
          id: `tk-${Date.now()}`,
          eventId,
          clientId,
          clientName,
          seatId,
          tableNumber: seat.tableNumber,
          price: seat.price,
          qrCode: `PL-${event.id}-${seat.tableNumber}-${Date.now()}`,
          status: 'valid',
          purchasedAt: new Date(),
        }

        set((state) => ({
          tickets: [ticket, ...state.tickets],
          publishedEvents: state.publishedEvents.map((item) =>
            item.id === eventId
              ? {
                  ...item,
                  seats: item.seats.map((currentSeat) =>
                    currentSeat.id === seatId ? { ...currentSeat, status: 'sold' } : currentSeat
                  ),
                }
              : item
          ),
        }))

        return ticket
      },

      validateTicket: (qrCode) => {
        const ticket = get().tickets.find((item) => item.qrCode.trim().toLowerCase() === qrCode.trim().toLowerCase())
        if (!ticket) return { ok: false, message: 'Convite nao encontrado.' }
        if (ticket.status === 'used') return { ok: false, message: 'Convite ja utilizado.', ticket }
        if (ticket.status === 'cancelled') return { ok: false, message: 'Convite cancelado.', ticket }

        const event = get().publishedEvents.find((item) => item.id === ticket.eventId)
        set((state) => ({
          tickets: state.tickets.map((item) =>
            item.id === ticket.id ? { ...item, status: 'used', usedAt: new Date() } : item
          ),
        }))

        return { ok: true, message: 'Convite validado com sucesso.', ticket: { ...ticket, status: 'used', usedAt: new Date() }, event }
      },
    }),
    {
      name: 'palace-venue',
    }
  )
)

export const tableStatusOptions: Array<{ value: TableStatus; label: string }> = [
  { value: 'available', label: 'Vaga' },
  { value: 'reserved', label: 'Reservada' },
  { value: 'occupied', label: 'Ocupada' },
  { value: 'maintenance', label: 'Manutencao' },
]

export const tableLocationOptions: Array<{ value: TableLocation; label: string }> = [
  { value: 'indoor', label: 'Interior' },
  { value: 'outdoor', label: 'Exterior' },
  { value: 'vip', label: 'VIP' },
]
