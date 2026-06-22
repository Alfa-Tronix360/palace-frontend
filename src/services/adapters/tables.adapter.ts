import { http } from '@/services/api/http'
import type { Table, TableStatus } from '@/types'

function normalizeTable(item: any): Table {
  return {
    id: String(item.id),
    number: item.number,
    capacity: item.capacity,
    location: item.location,
    status: item.status,
    description: item.description,
    x: item.x,
    y: item.y,
    areaId: item.area_id ? String(item.area_id) : undefined,
    priceTier: item.price_tier,
    imageUrl: item.image_url,
    price: item.price,
  }
}

export const tablesAdapter = {
  async getAll(): Promise<Table[]> {
    const data = await http.get<unknown, any[]>('/venue/tables')
    return data.map(normalizeTable)
  },

  async getAvailable(date: string, time: string, guests: number): Promise<Table[]> {
    const data = await http.get<unknown, any[]>('/venue/tables/availability', {
      params: { date, time, guests },
    })
    return data.map(normalizeTable)
  },

  async getById(id: string): Promise<Table> {
    const data = await http.get<unknown, any>(`/venue/tables/${id}`)
    return normalizeTable(data)
  },

  async updateStatus(id: string, status: TableStatus): Promise<Table> {
    const data = await http.patch<unknown, any>(`/venue/tables/${id}`, { status })
    return normalizeTable(data)
  },
}