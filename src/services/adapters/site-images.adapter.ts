import { http } from '@/services/api/http'

export interface SiteImage {
  key: string
  imageUrl: string
  updatedAt: string
}

export const siteImagesAdapter = {
  async getAll(): Promise<SiteImage[]> {
    return http.get<unknown, SiteImage[]>('/site-images')
  },

  async set(key: string, imageUrl: string): Promise<SiteImage> {
    return http.put<unknown, SiteImage>(`/site-images/${key}`, { image_url: imageUrl })
  },

async upload(key: string, file: File): Promise<SiteImage> {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<unknown, SiteImage>(`/site-images/${key}/upload`, formData, {
      headers: { 'Content-Type': undefined },
    })
  },

  async reset(key: string): Promise<void> {
    await http.delete(`/site-images/${key}`)
  },
}