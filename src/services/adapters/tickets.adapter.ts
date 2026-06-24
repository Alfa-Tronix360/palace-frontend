import { http } from '@/services/api/http'
import type { DigitalTicket, TicketSeat } from '@/types'

export const ticketsAdapter = {
 async getEventSeats(eventId: string): Promise<TicketSeat[]> {
  const data = await http.get<unknown, any[]>(`/published-events/${eventId}/seats`)
  if (!Array.isArray(data)) return []
  return data.map((s: any) => ({
    id: String(s.id),
    tableId: String(s.table_id ?? s.tableId),
    tableNumber: s.table_number ?? s.tableNumber,
    x: s.x ?? 20,
    y: s.y ?? 40,
    capacity: s.capacity,
    location: s.location,
    price: s.price,
    status: s.status,
  }))
},

  async purchase(eventId: string, seatId: string): Promise<DigitalTicket> {
    return http.post<unknown, DigitalTicket>('/tickets/purchase', {
      event_id: Number(eventId),
      seat_id: Number(seatId),
    })
  },

  async getMyTickets(): Promise<DigitalTicket[]> {
    const data = await http.get<unknown, any[]>('/tickets/my')
    return Array.isArray(data) ? data : []
  },
}