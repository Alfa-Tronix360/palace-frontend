import { http } from '@/services/api/http'
import type { Payment } from '@/types'

function normalizePayment(item: any): Payment {
  return {
    id: String(item.id),
    reservationId: item.reservationId ? String(item.reservationId) : undefined,
    eventId: item.eventId ? String(item.eventId) : undefined,
    clientId: String(item.clientId),
    clientName: item.clientName,
    amount: item.amount,
    method: item.method,
    status: item.status,
    reference: item.reference,
    date: new Date(item.date),
  }
}

export const paymentsAdapter = {
  async getAll(filters?: { status?: string; method?: string }): Promise<Payment[]> {
    const data = await http.get<unknown, any[]>('/payments', { params: filters })
    return data.map(normalizePayment)
  },

  async confirm(id: string): Promise<Payment> {
    const data = await http.post<unknown, any>(`/payments/${id}/confirm`)
    return normalizePayment(data)
  },
}