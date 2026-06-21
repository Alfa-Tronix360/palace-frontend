import { http } from '@/services/api/http'
import type { User, ClientFilters } from '@/types'

function normalizeUser(item: User): User {
  return { ...item, createdAt: new Date(item.createdAt) }
}

export const clientsAdapter = {
  async getAll(filters?: ClientFilters): Promise<User[]> {
    const data = await http.get<unknown, User[]>('/clients', { params: filters })
    return data.map(normalizeUser)
  },

  async getById(id: string): Promise<User> {
    const client = await http.get<unknown, User>(`/clients/${id}`)
    return normalizeUser(client)
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const client = await http.patch<unknown, User>(`/clients/${id}`, data)
    return normalizeUser(client)
  },



async delete(id: string): Promise<void> {
  await http.delete(`/clients/${id}`)
},

}