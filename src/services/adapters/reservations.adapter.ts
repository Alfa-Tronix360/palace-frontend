import { http } from '@/services/api/http'
import type { Reservation, ReservationFilters, CreateReservationDTO, UpdateReservationDTO } from '@/types'

function normalizeReservation(item: Reservation): Reservation {
  return {
    ...item,
    date: new Date(item.date),
    createdAt: new Date(item.createdAt),
  }
}

export const reservationsAdapter = {
  async getAll(filters?: ReservationFilters): Promise<Reservation[]> {
    const data = await http.get<unknown, Reservation[]>('/reservations', { params: filters })
    return data.map(normalizeReservation)
  },

  async getById(id: string): Promise<Reservation> {
    const data = await http.get<unknown, Reservation>(`/reservations/${id}`)
    return normalizeReservation(data)
  },

  async create(data: CreateReservationDTO): Promise<Reservation> {
  const payload = {
    ...data,
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
    tableId: Number(data.tableId),
  }
  const created = await http.post<unknown, Reservation>('/reservations', payload)
  return normalizeReservation(created)
},

  async update(id: string, data: UpdateReservationDTO): Promise<Reservation> {
    const payload = { ...data, date: data.date instanceof Date ? data.date.toISOString() : data.date }
    const updated = await http.patch<unknown, Reservation>(`/reservations/${id}`, payload)
    return normalizeReservation(updated)
  },

  async cancel(id: string): Promise<void> {
    await http.post(`/reservations/${id}/cancel`)
  },

  async confirm(id: string): Promise<Reservation> {
    const updated = await http.post<unknown, Reservation>(`/reservations/${id}/confirm`)
    return normalizeReservation(updated)
  },
}
