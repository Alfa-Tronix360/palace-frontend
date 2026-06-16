import { http } from '@/services/api/http'
import type { MenuItem, MenuCategory } from '@/types'

function normalizeMenuItem(item: any): MenuItem {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description,
    category: item.category as MenuCategory,
    price: item.price,
    imageUrl: item.imageUrl || item.image_url,
    available: item.available,
    featured: item.featured,
    allergens: item.allergens || [],
    createdAt: new Date(item.created_at),
  }
}

export const menuAdapter = {
  async getAll(filters?: { category?: string; available?: boolean; featured?: boolean; search?: string }): Promise<MenuItem[]> {
    const data = await http.get<unknown, any[]>('/menu', { params: filters })
    return data.map(normalizeMenuItem)
  },

  async create(data: { name: string; description: string; category: string; price: number; available: boolean; featured: boolean; imageUrl?: string; allergens?: string[] }): Promise<MenuItem> {
    const item = await http.post<unknown, any>('/menu', {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      available: data.available,
      featured: data.featured,
      image_url: data.imageUrl,
      allergens: data.allergens || [],
    })
    return normalizeMenuItem(item)
  },

  async update(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const item = await http.patch<unknown, any>(`/menu/${id}`, {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      available: data.available,
      featured: data.featured,
      image_url: data.imageUrl,
      allergens: data.allergens || [],
    })
    return normalizeMenuItem(item)
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/menu/${id}`)
  },
}