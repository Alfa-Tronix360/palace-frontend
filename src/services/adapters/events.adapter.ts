import { http } from '@/services/api/http'
import type { CreateEventDTO, Event, EventFilters } from '@/types'

function normalizeEvent(item: Event): Event {
  return {
    ...item,
    date: new Date(item.date),
    createdAt: new Date(item.createdAt),
  }
}

export const eventsAdapter = {
  async getAll(filters?: EventFilters): Promise<Event[]> {
    const data = await http.get<unknown, Event[]>('/events', { params: filters })
    return data.map(normalizeEvent)
  },

  async getById(id: string): Promise<Event> {
    const event = await http.get<unknown, Event>(`/events/${id}`)
    return normalizeEvent(event)
  },

  async create(data: CreateEventDTO): Promise<Event> {
    const payload = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    }
    const created = await http.post<unknown, Event>('/events', payload)
    return normalizeEvent(created)
  },

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const payload = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    }
    const updated = await http.patch<unknown, Event>(`/events/${id}`, payload)
    return normalizeEvent(updated)
  },
}
