import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eventsAdapter } from '@/services/adapters/events.adapter'
import { reservationsAdapter } from '@/services/adapters/reservations.adapter'
import { tablesAdapter } from '@/services/adapters/tables.adapter'
import { queryKeys } from '@/lib/query-client'
import type { CreateEventDTO, CreateReservationDTO, EventFilters, ReservationFilters } from '@/types'

export function useClientReservations(clientId?: string) {
  const filters: ReservationFilters = clientId ? { clientId } : {}

  return useQuery({
    queryKey: queryKeys.reservations.list({ ...filters }),
    queryFn: () => reservationsAdapter.getAll(filters),
    enabled: !!clientId,
  })
}

export function useCreateClientReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReservationDTO) => reservationsAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all })
      toast.success('Reserva criada com sucesso.')
    },
    onError: () => {
      toast.error('Nao foi possivel criar a reserva.')
    },
  })
}

export function useCancelClientReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reservationsAdapter.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
      toast.success('Reserva cancelada.')
    },
    onError: () => {
      toast.error('Nao foi possivel cancelar a reserva.')
    },
  })
}

export function useAvailableTables(date: Date | null, time: string | null, guests: number) {
  const dateKey = date ? date.toISOString().slice(0, 10) : ''

  return useQuery({
    queryKey: dateKey && time ? ['tables', 'available', dateKey, time, guests] : queryKeys.tables.all,
    queryFn: () => tablesAdapter.getAvailable(dateKey, time ?? '', guests),
    enabled: !!dateKey && !!time,
  })
}

export function useClientEvents(clientId?: string) {
  const filters: EventFilters = {}

  return useQuery({
    queryKey: queryKeys.events.list({ clientId }),
    queryFn: async () => {
      const events = await eventsAdapter.getAll(filters)
      return clientId ? events.filter((event) => event.clientId === clientId) : events
    },
    enabled: !!clientId,
  })
}

export function useCreateClientEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEventDTO) => eventsAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all })
      toast.success('Pedido de evento enviado.')
    },
    onError: () => {
      toast.error('Nao foi possivel enviar o pedido.')
    },
  })
}
