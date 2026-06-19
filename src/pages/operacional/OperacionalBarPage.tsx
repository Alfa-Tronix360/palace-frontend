import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/api/http'
import { formatCurrency } from '@/lib/utils'

export default function OperacionalBarPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['fluxo-bar'],
        queryFn: () => http.get<unknown, any>('/operacional/fluxo/bar'),
        refetchInterval: 30_000,
    })

    const pedidos = Array.isArray(data) ? data : []
    console.log('DATA:', data, 'ERROR:', error)

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Operacional</p>
                <h1 className="font-display text-3xl text-primary">Fluxo Bar</h1>
                <p className="mt-1 text-sm text-muted-foreground">Pedidos de bebidas em tempo real. Actualiza a cada 30 segundos.</p>
            </motion.div>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">A carregar pedidos...</p>
            ) : pedidos.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pedidos.map((pedido: any) => (
                        <div key={pedido.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-muted-foreground">{pedido.code}</span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    Mesa {pedido.table_id}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {(pedido.items ?? []).map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-foreground">{item.quantity}x {item.name}</span>
                                        <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-border flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-semibold" style={{ color: '#B89A67' }}>{formatCurrency(pedido.total)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {new Date(pedido.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
                    Sem pedidos de bar neste momento.
                </div>
            )}
        </div>
    )
}