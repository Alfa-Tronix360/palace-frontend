import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/services/api/http'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
    attendant: 'Assistente',
    seller: 'Vendedor',
    operator: 'Operador',
}

export default function OperacionalEquipaPage() {
    const user = useAuthStore((state) => state.user)
    const queryClient = useQueryClient()
    const podeEscalar = user?.role === 'chefe_sala' || user?.role === 'chefe_cozinha'

    const { data: equipaData, isLoading } = useQuery({
        queryKey: ['operacional-equipa'],
        queryFn: () => http.get<unknown, any>('/operacional/equipa'),
    })
    const equipa = Array.isArray(equipaData) ? equipaData : []

    const { data: tablesData } = useQuery({
        queryKey: ['tables'],
        queryFn: () => http.get<unknown, any>('/venue/tables'),
        enabled: podeEscalar,
    })
    const tables = Array.isArray(tablesData) ? tablesData : []
    const atribuirMesaMutation = useMutation({
        mutationFn: ({ employeeId, tableId }: { employeeId: number; tableId: number | null }) =>
            http.patch(`/operacional/equipa/${employeeId}/mesa`, null, { params: { table_id: tableId ?? undefined } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operacional-equipa'] })
            toast.success('Mesa atribuída com sucesso.')
        },
        onError: () => toast.error('Erro ao atribuir mesa.'),
    })

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Operacional</p>
                <h1 className="font-display text-3xl text-primary">Equipa</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {podeEscalar ? 'Veja e escale a equipa de trabalho.' : 'Consulte a equipa do turno.'}
                </p>
            </motion.div>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">A carregar equipa...</p>
            ) : equipa.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {equipa.map((membro: any) => (
                        <div key={membro.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-foreground">{membro.name}</p>
                                    <p className="text-xs text-muted-foreground">{roleLabels[membro.role] ?? membro.role}</p>
                                </div>
                                <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">Activo</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{membro.phone}</p>
                            {podeEscalar && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Atribuir mesa</p>
                                    <select
                                        value={membro.table_id ?? ''}
                                        onChange={(e) => atribuirMesaMutation.mutate({
                                            employeeId: membro.id,
                                            tableId: e.target.value ? Number(e.target.value) : null,
                                        })}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="">Sem mesa</option>
                                        {tables.map((t: any) => (
                                            <option key={t.id} value={t.id}>Mesa {t.number}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {!podeEscalar && membro.table_id && (
                                <p className="text-sm text-muted-foreground">Mesa {membro.table_id}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                    Nenhum funcionário activo neste momento.
                </div>
            )}
        </div>
    )
}