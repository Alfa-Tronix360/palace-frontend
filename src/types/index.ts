/* ─── Utilizadores ───────────────────────────────────────────────────────── */

export type UserRole = 'admin' | 'client' | 'staff' | 'chefe_sala' | 'chefe_cozinha' | 'bar'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  vip: boolean
  totalSpent: number
  reservationCount: number
  avatarUrl?: string
  createdAt: Date
}

/* ─── Mesas ──────────────────────────────────────────────────────────────── */

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'maintenance'
export type TableLocation = 'indoor' | 'outdoor' | 'vip'

export interface Table {
  id: string
  number: number
  capacity: number
  location: TableLocation
  status: TableStatus
  description?: string
  x?: number
  y?: number
  areaId?: string
  priceTier?: 'standard' | 'premium' | 'vip'
  imageUrl?: string
   price?: number 
}

export type VenueAreaShape = 'rectangle' | 'circle'

export interface VenueArea {
  id: string
  name: string
  shape: VenueAreaShape
  x: number
  y: number
  width: number
  height: number
  color: string
  ticketPrice: number
  description?: string
}

export type TicketSeatStatus = 'available' | 'sold' | 'blocked'

export interface TicketSeat {
  id: string
  tableId: string
  tableNumber: number
  x: number
  y: number
  capacity: number
  location: TableLocation
  price: number
  status: TicketSeatStatus
}

export interface PublishedEvent {
  id: string
  title: string
  date: Date
  time: string
  description: string
  stageLabel: string
  bannerUrl?: string
  basePrice: number
  published: boolean
  seats: TicketSeat[]
  createdAt: Date
}

export interface DigitalTicket {
  id: string
  eventId: string
  clientId: string
  clientName: string
  clientPhone?: string
  seatId: string
  tableNumber: number
  price: number
  qrCode: string
  whatsappUrl?: string
  deliveryStatus?: 'pending' | 'sent'
  status: 'valid' | 'used' | 'cancelled'
  usedAt?: Date
  purchasedAt: Date
}

export type EmployeeRole = 'attendant' | 'seller' | 'operator'

export interface Employee {
  id: string
  name: string
  phone: string
  role: EmployeeRole
  tableId?: string
  active: boolean
  createdAt: Date
}

export interface EmployeeOrderItem {
  name: string
  quantity: number
  price: number
}

export interface EmployeeOrder {
  id: string
  code: string
  employeeId: string
  employeeName: string
  tableId: string
  tableNumber: number
  items: EmployeeOrderItem[]
  total: number
  createdAt: Date
}

/* ─── Reservas ───────────────────────────────────────────────────────────── */

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'in_service'
  | 'completed'
  | 'cancelled'

export interface Reservation {
  id: string
  code: string
  clientId: string
  clientName: string
  tableId: string
  tableNumber: number
  date: Date
  time: string
  guests: number
  status: ReservationStatus
  notes?: string
  paymentId?: string
  createdAt: Date
}

export interface CreateReservationDTO {
  clientId: string
  tableId: string
  date: Date
  time: string
  guests: number
  notes?: string
}

export interface UpdateReservationDTO {
  tableId?: string
  date?: Date
  time?: string
  guests?: number
  status?: ReservationStatus
  notes?: string
}

/* ─── Eventos ────────────────────────────────────────────────────────────── */

export type EventType =
  | 'birthday'
  | 'wedding'
  | 'corporate'
  | 'private_dinner'
  | 'themed'

export type EventStatus =
  | 'pending'
  | 'approved'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export interface Event {
  id: string
  code: string
  type: EventType
  clientId: string
  clientName: string
  date: Date
  guests: number
  status: EventStatus
  notes?: string
  budget?: number
  depositPaid: boolean
  createdAt: Date
}

export interface CreateEventDTO {
  type: EventType
  clientId: string
  date: Date
  guests: number
  notes?: string
}

/* ─── Cardápio ───────────────────────────────────────────────────────────── */

export type MenuCategory = 'starters' | 'mains' | 'desserts' | 'drinks' | 'cocktails' | 'wines'

export interface MenuItem {
  id: string
  name: string
  description: string
  category: MenuCategory
  price: number
  imageUrl?: string
  available: boolean
  featured: boolean
  allergens?: string[]
  createdAt: Date
}

export interface CreateMenuItemDTO {
  name: string
  description: string
  category: MenuCategory
  price: number
  imageUrl?: string
  available: boolean
  featured: boolean
}

/* ─── Pagamentos ─────────────────────────────────────────────────────────── */

export type PaymentMethod = 'multicaixa' | 'bank_transfer' | 'tpa' | 'visa_mastercard'
export type PaymentStatus = 'pending' | 'confirmed' | 'failed'

export interface Payment {
  id: string
  reservationId?: string
  eventId?: string
  clientId: string
  clientName: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference?: string
  date: Date
}

/* ─── Avaliações ─────────────────────────────────────────────────────────── */

export interface Review {
  id: string
  clientId: string
  clientName: string
  reservationId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  service: number
  atmosphere: number
  food: number
  drinks: number
  createdAt: Date
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */

export interface DashboardKPIs {
  reservationsToday: number
  reservationsThisMonth: number
  registeredClients: number
  scheduledEvents: number
  dailyRevenue: number
  monthlyRevenue: number
  occupancyRate: number
  cancellationRate: number
  cancelledReservations: number
  vipClients: number
}

export interface ChartDataPoint {
  label: string
  value: number
  secondary?: number
}

/* ─── Filtros e paginação ────────────────────────────────────────────────── */

export interface PaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ReservationFilters {
  status?: ReservationStatus
  date?: Date
  clientId?: string
  search?: string
}

export interface EventFilters {
  status?: EventStatus
  type?: EventType
  search?: string
}

export interface ClientFilters {
  vip?: boolean
  search?: string
}

export interface MenuFilters {
  category?: MenuCategory
  available?: boolean
  featured?: boolean
  search?: string
}

export interface PaymentFilters {
  status?: PaymentStatus
  method?: PaymentMethod
  dateFrom?: Date
  dateTo?: Date
}
