import { http } from '@/services/api/http'
import type { PublishedEvent } from '@/types'

function normalizeEvent(item: any): PublishedEvent {
  return {
    ...item,
    date: new Date(item.date),
    createdAt: new Date(item.createdAt),
  }
}

export const publishedEventsAdapter = {
  async getAll(): Promise<PublishedEvent[]> {
    const data = await http.get<unknown, any[]>('/published-events')
    return Array.isArray(data) ? data.map(normalizeEvent) : []
  },

  async getById(id: string): Promise<PublishedEvent> {
    const data = await http.get<unknown, any>(`/published-events/${id}`)
    return normalizeEvent(data)
  },
}