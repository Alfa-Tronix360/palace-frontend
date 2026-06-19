import { http } from '@/services/api/http'

export interface TransferRequest {
  id: number
  clientId: number
  vehicleType: string
  vehicleModel?: string
  date: string
  time: string
  pickupLocation: string
  notes?: string
  status: string
  createdAt: string
}

export interface CreateTransferDTO {
  clientId: number
  vehicleType: string
  vehicleModel?: string
  date: string
  time: string
  pickupLocation: string
  notes?: string
}

export const transfersAdapter = {
  async create(data: CreateTransferDTO): Promise<TransferRequest> {
    return http.post<unknown, TransferRequest>('/transfers', data)
  },

  async getMine(clientId: number): Promise<TransferRequest[]> {
    return http.get<unknown, TransferRequest[]>(`/transfers/me/${clientId}`)
  },
}