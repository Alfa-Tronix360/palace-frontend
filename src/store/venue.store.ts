import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockTables } from '@/data/mock-tables'
import { http } from '@/services/api/http'
import type {
  DigitalTicket,
  Employee,
  EmployeeOrder,
  EmployeeOrderItem,
  EmployeeRole,
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
  employees: Employee[]
  employeeOrders: EmployeeOrder[]
  walkInClients: User[]
  walkInReservations: Reservation[]
  addArea: () => void
  updateArea: (id: string, data: VenueAreaUpdate) => void
  deleteArea: (id: string) => void
  mergeAreas: (primaryId: string, secondaryId: string) => void
  addTable: (areaId?: string) => void
  updateTable: (id: string, data: VenueTableUpdate) => void
  removeTable: (id: string) => void
  registerWalkInClient: (data: { name: string; email?: string; phone: string }) => User
  reserveTableForWalkIn: (data: { clientId: string; tableId: string; guests: number; time: string; notes?: string; occupyNow?: boolean }) => Reservation
  occupyTable: (tableId: string) => void
  releaseTable: (tableId: string) => void
  createPublishedEvent: (data: CreatePublishedEventInput) => void
  toggleEventPublished: (id: string) => void
  registerEmployee: (data: { name: string; phone: string; role: EmployeeRole; tableId?: string }) => Employee
  assignEmployeeToTable: (employeeId: string, tableId?: string) => void
  createEmployeeOrder: (data: { employeeId: string; tableId: string; items: EmployeeOrderItem[] }) => EmployeeOrder
  buyTicket: (eventId: string, seatId: string, clientId: string, clientName: string, clientPhone?: string) => DigitalTicket
  sendTicketWhatsApp: (ticketId: string, phone: string) => DigitalTicket | undefined
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

function buildWhatsAppTicketUrl(ticket: DigitalTicket, event?: PublishedEvent, phone?: string) {
  const digits = (phone || ticket.clientPhone || '').replace(/\D/g, '')
  if (!digits) return undefined
  const text = [
    `Convite digital Palace Lounge`,
    event ? `Evento: ${event.title}` : undefined,
    `Mesa: ${ticket.tableNumber}`,
    `Codigo QR: ${ticket.qrCode}`,
  ].filter(Boolean).join('\n')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export const useVenueStore = create<VenueState>()(
  persist(
    (set, get) => ({
      areas: initialAreas,
      tables: initialTables,
      publishedEvents: [],
      tickets: [],
      employees: [],
      employeeOrders: [],
      walkInClients: [],
      walkInReservations: [],

      addArea: () => {
        const newArea: VenueArea = {
          id: `area-${Date.now()}`,
          name: `Area ${get().areas.length + 1}`,
          shape: 'rectangle',
          x: 12, y: 30, width: 24, height: 28,
          color: '#B89A67',
          ticketPrice: 25000,
        }
        http.post('/venue/areas', {
          name: newArea.name, shape: newArea.shape,
          x: newArea.x, y: newArea.y, width: newArea.width, height: newArea.height,
          color: newArea.color, ticket_price: newArea.ticketPrice,
        }).catch(() => {})
        set((state) => ({ areas: [...state.areas, newArea] }))
      },

      updateArea: (id, data) => {
        http.patch(`/venue/areas/${id}`, {
          name: data.name, shape: data.shape,
          x: data.x, y: data.y, width: data.width, height: data.height,
          color: data.color, ticket_price: data.ticketPrice,
          description: data.description,
        }).catch(() => {})
        set((state) => ({
          areas: state.areas.map((area) => (area.id === id ? { ...area, ...data } : area)),
        }))
      },

      deleteArea: (id) => {
        http.delete(`/venue/areas/${id}`).catch(() => {})
        set((state) => ({
          areas: state.areas.filter((area) => area.id !== id),
          tables: state.tables.map((table) => (table.areaId === id ? { ...table, areaId: undefined } : table)),
        }))
      },

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
                      x: left, y: top,
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

      addTable: (areaId) => {
        const state = get()
        const area = state.areas.find((item) => item.id === areaId)
        const maxNumber = state.tables.reduce((max, table) => Math.max(max, table.number), 0)
        const newTable: Table = {
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
        }
        http.post('/venue/tables', {
          number: newTable.number,
          capacity: newTable.capacity,
          location: newTable.location,
          status: newTable.status,
          description: newTable.description,
          x: newTable.x,
          y: newTable.y,
          priceTier: newTable.priceTier,
        }).then((res: any) => {
          set((state) => ({
            tables: state.tables.map((t) =>
              t.id === newTable.id ? { ...t, id: String(res.id) } : t
            ),
          }))
        }).catch(() => {})
        set((state) => ({ tables: [...state.tables, newTable] }))
      },

      updateTable: (id, data) => {
        http.patch(`/venue/tables/${id}`, {
          status: data.status,
          capacity: data.capacity,
          location: data.location,
          description: data.description,
          image_url: data.imageUrl,
          x: data.x,
          y: data.y,
          price_tier: data.priceTier,
        }).catch(() => {})
        set((state) => ({
          tables: state.tables.map((table) => (table.id === id ? { ...table, ...data } : table)),
        }))
      },

    removeTable: (id) => {
         set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
        }))
       },
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
        set((state) => ({ walkInClients: [client, ...state.walkInClients] }))
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

      registerEmployee: (data) => {
        const employee: Employee = {
          id: `emp-${Date.now()}`,
          name: data.name,
          phone: data.phone,
          role: data.role,
          tableId: data.tableId,
          active: true,
          createdAt: new Date(),
        }
        set((state) => ({ employees: [employee, ...state.employees] }))
        return employee
      },

      assignEmployeeToTable: (employeeId, tableId) =>
        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === employeeId ? { ...employee, tableId } : employee
          ),
        })),

      createEmployeeOrder: (data) => {
        const employee = get().employees.find((item) => item.id === data.employeeId)
        const table = get().tables.find((item) => item.id === data.tableId)
        if (!employee || !table) throw new Error('Funcionario ou mesa invalida')
        if (!data.items.length) throw new Error('Pedido vazio')
        const total = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
        const order: EmployeeOrder = {
          id: `ord-${Date.now()}`,
          code: `PD-${String(get().employeeOrders.length + 1).padStart(4, '0')}`,
          employeeId: employee.id,
          employeeName: employee.name,
          tableId: table.id,
          tableNumber: table.number,
          items: data.items,
          total,
          createdAt: new Date(),
        }
        set((state) => ({ employeeOrders: [order, ...state.employeeOrders] }))
        return order
      },

      buyTicket: (eventId, seatId, clientId, clientName, clientPhone) => {
        const event = get().publishedEvents.find((item) => item.id === eventId)
        const seat = event?.seats.find((item) => item.id === seatId)
        if (!event || !seat || seat.status !== 'available') throw new Error('Lugar indisponivel')
        const ticket: DigitalTicket = {
          id: `tk-${Date.now()}`,
          eventId,
          clientId,
          clientName,
          seatId,
          tableNumber: seat.tableNumber,
          price: seat.price,
          qrCode: `PL-${event.id}-${seat.tableNumber}-${Date.now()}`,
          clientPhone,
          deliveryStatus: 'pending',
          status: 'valid',
          purchasedAt: new Date(),
        }
        ticket.whatsappUrl = buildWhatsAppTicketUrl(ticket, event, clientPhone)
        set((state) => ({
          tickets: [ticket, ...state.tickets],
          publishedEvents: state.publishedEvents.map((item) =>
            item.id === eventId
              ? { ...item, seats: item.seats.map((s) => s.id === seatId ? { ...s, status: 'sold' } : s) }
              : item
          ),
        }))
        return ticket
      },

      sendTicketWhatsApp: (ticketId, phone) => {
        const ticket = get().tickets.find((item) => item.id === ticketId)
        const event = ticket ? get().publishedEvents.find((item) => item.id === ticket.eventId) : undefined
        if (!ticket) return undefined
        const updatedTicket = {
          ...ticket,
          clientPhone: phone,
          deliveryStatus: 'sent' as const,
          whatsappUrl: buildWhatsAppTicketUrl(ticket, event, phone),
        }
        set((state) => ({
          tickets: state.tickets.map((item) => (item.id === ticketId ? updatedTicket : item)),
        }))
        return updatedTicket
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
    { name: 'palace-venue' }
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