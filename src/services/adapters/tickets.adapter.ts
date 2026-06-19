import { http } from '@/services/api/http'
import type { DigitalTicket, TicketSeat } from '@/types'

export const ticketsAdapter = {
  async getEventSeats(eventId: string): Promise<TicketSeat[]> {
    const data = await http.get<unknown, any[]>(`/published-events/${eventId}/seats`)
    return Array.isArray(data) ? data : []
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