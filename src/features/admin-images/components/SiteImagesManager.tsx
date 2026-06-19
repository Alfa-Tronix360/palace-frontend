import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { siteImagesAdapter } from '@/services/adapters/site-images.adapter'
import { SITE_IMAGE_SLOTS } from '@/lib/site-images.constants'
import { toast } from 'sonner'
import { RotateCcw, Upload } from 'lucide-react'

export function SiteImagesManager() {
    const queryClient = useQueryClient()
    const [uploadingKey, setUploadingKey] = useState<string | null>(null)

    const { data: overrides = [] } = useQuery({
        queryKey: ['site-images'],
        queryFn: () => siteImagesAdapter.getAll(),
    })

    const overrideMap = new Map(overrides.map(img => [img.key, img.imageUrl]))

    const uploadMutation = useMutation({
        mutationFn: ({ key, file }: { key: string; file: File }) => siteImagesAdapter.upload(key, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-images'] })
            toast.success('Imagem atualizada.')
        },
        onError: () => toast.error('Erro ao carregar imagem.'),
        onSettled: () => setUploadingKey(null),
    })

    const resetMutation = useMutation({
        mutationFn: (key: string) => siteImagesAdapter.reset(key),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-images'] })
            toast.success('Imagem reposta para o padrão.')
        },
        onError: () => toast.error('Erro ao repor imagem.'),
    })

    function handleFileChange(key: string, file: File) {
        setUploadingKey(key)
        uploadMutation.mutate({ key, file })
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SITE_IMAGE_SLOTS.map(slot => {
                const currentUrl = overrideMap.get(slot.key) ?? slot.defaultUrl
                const isOverridden = overrideMap.has(slot.key)
                const isUploading = uploadingKey === slot.key

                return (
                    <div key={slot.key} className="rounded-lg border border-border bg-surface p-3 space-y-2">
                        <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
                            <img src={currentUrl} alt={slot.label} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-medium text-foreground">{slot.label}</p>

                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileChange(slot.key, file)
                                    }}
                                />
                                <span className="flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors">
                                    <Upload className="w-3.5 h-3.5" />
                                    {isUploading ? 'A carregar...' : 'Trocar'}
                                </span>
                            </label>

                            {isOverridden && (
                                <button
                                    onClick={() => resetMutation.mutate(slot.key)}
                                    title="Repor imagem padrão"
                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-border hover:bg-secondary transition-colors text-muted-foreground"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
