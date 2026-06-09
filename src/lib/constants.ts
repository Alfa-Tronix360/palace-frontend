export const ROUTES = {
  HOME: '/',
  ABOUT: '/sobre',
  MENU: '/menu',
  GALLERY: '/galeria',
  CONTACTS: '/contactos',
  LOGIN: '/login',
  REGISTER: '/registo',
  SCANNER: '/scanner',
  CLIENT: {
    DASHBOARD: '/cliente',
    RESERVATIONS: '/cliente/reservas',
    EVENTS: '/cliente/eventos',
    PROFILE: '/cliente/perfil',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    RESERVATIONS: '/admin/reservas',
    TABLES: '/admin/mesas',
    CLIENTS: '/admin/clientes',
    EVENTS: '/admin/eventos',
    MENU: '/admin/cardapio',
    PAYMENTS: '/admin/pagamentos',
    REPORTS: '/admin/relatorios',
  },
} as const

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_SERVICE: 'in_service',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  in_service: 'Em Atendimento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-info/20 text-info',
  in_service: 'bg-accent/20 text-accent',
  completed: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
}

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
} as const

export const TABLE_STATUS_LABELS: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservada',
  occupied: 'Ocupada',
  maintenance: 'Manutenção',
}

export const TABLE_LOCATION_LABELS: Record<string, string> = {
  indoor: 'Interior',
  outdoor: 'Exterior',
  vip: 'VIP',
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Aniversário',
  wedding: 'Casamento',
  corporate: 'Evento Corporativo',
  private_dinner: 'Jantar Privado',
  themed: 'Festa Temática',
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const MENU_CATEGORY_LABELS: Record<string, string> = {
  starters: 'Entradas',
  mains: 'Pratos Principais',
  desserts: 'Sobremesas',
  drinks: 'Bebidas',
  cocktails: 'Cocktails',
  wines: 'Vinhos',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  multicaixa: 'Multicaixa Express',
  bank_transfer: 'Transferência Bancária',
  tpa: 'TPA',
  visa_mastercard: 'Visa / Mastercard',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  failed: 'Falhado',
}

export const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30',
]

export const VIP_THRESHOLD_AOA = 200_000

export const APP_NAME = 'Palace Lounge'
export const APP_DESCRIPTION = 'Restaurante Premium em Luanda, Angola'
export const APP_PHONE = '+244 941 805 698'
export const APP_ADDRESS = 'R. Maj. Kanhangulo Andar, Luanda, Angola'
