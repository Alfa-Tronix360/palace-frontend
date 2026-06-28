import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MenuItemsTable } from '@/features/admin-menu/components/MenuItemsTable'
import { menuAdapter } from '@/services/adapters/menu.adapter'
import { MENU_CATEGORY_LABELS } from '@/lib/constants'
import type { MenuCategory, MenuItem } from '@/types'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const categories = Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]

const EMPTY_FORM = {
  name: '',
  description: '',
  category: categories[0],
  price: '',
  image_url: '',
  available: true,
  featured: false,
  allergens: '',
}

export default function AdminMenuPage() {
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [uploadingExtra, setUploadingExtra] = useState(false)

  const { data: menu = [] } = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuAdapter.getAll(),
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof menuAdapter.create>[0]) => menuAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      handleClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof menuAdapter.update>[1] }) =>
      menuAdapter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      handleClose()
    },
  })

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'palace_lounge')
    const res = await fetch('https://api.cloudinary.com/v1_1/dkcq4gtxp/image/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url
  }

  function handleEdit(item: MenuItem) {
    setExtraImages(item.images ?? [])
    setEditItem(item)
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      image_url: item.imageUrl ?? '',
      available: item.available,
      featured: item.featured,
      allergens: item.allergens?.join(', ') ?? '',
    })
    setImagePreview(item.imageUrl ?? '')
    setOpen(true)
  }

  async function handleSubmit() {
    if (!form.name || !form.price) return

    let imageUrl = form.image_url

    if (imageFile) {
      setUploading(true)
      try {
        imageUrl = await uploadImage(imageFile)
      } catch (err) {
        console.error('Erro ao carregar imagem:', err)
        setUploading(false)
        return
      }
      setUploading(false)
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      available: form.available,
      featured: form.featured,
      imageUrl: imageUrl,
      allergens: form.allergens
        ? form.allergens.split(',').map(a => a.trim()).filter(Boolean)
        : [],
      images: extraImages,
    }

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleClose() {
    setExtraImages([])
    setOpen(false)
    setEditItem(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview('')
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Gestão</p>
          <h1 className="font-display text-3xl text-primary">Cardápio</h1>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </motion.div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {categories.map(cat => {
          const count = menu.filter(i => i.category === cat).length
          return (
            <div key={cat} className="rounded-lg border border-border/40 bg-surface p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{MENU_CATEGORY_LABELS[cat]}</p>
            </div>
          )
        })}
      </div>

      <MenuItemsTable onEdit={handleEdit} />

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Item' : 'Novo Item do Cardápio'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                placeholder="Ex: Picanha Premium"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                rows={3}
                placeholder="Descrição do item..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Categoria *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{MENU_CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Preço (Kz) *</label>
                <input
                  name="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                  placeholder="Ex: 18500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Imagem</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    setImagePreview(URL.createObjectURL(file))
                  }
                }}
                className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-24 rounded-md object-cover" />
              )}

              <div>
                <label className="text-sm font-medium">Imagens adicionais</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (!files.length) return
                    setUploadingExtra(true)
                    try {
                      const urls = await Promise.all(files.map(uploadImage))
                      setExtraImages(prev => [...prev, ...urls])
                    } catch {
                      console.error('Erro ao carregar imagens')
                    }
                    setUploadingExtra(false)
                  }}
                  className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                />
                {uploadingExtra && <p className="text-xs text-muted-foreground mt-1">A carregar...</p>}
                {extraImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extraImages.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`Extra ${i}`} className="h-16 w-16 rounded-md object-cover" />
                        <button type="button"
                          onClick={() => setExtraImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white rounded-full text-xs flex items-center justify-center">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div>
              <label className="text-sm font-medium">Alergénios</label>
              <input
                name="allergens"
                type="text"
                value={form.allergens}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-border bg-background p-2 text-sm"
                placeholder="Ex: glúten, lactose (separados por vírgula)"
              />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input name="available" type="checkbox" checked={form.available} onChange={handleChange} className="w-4 h-4" />
                Disponível
              </label>
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} className="w-4 h-4" />
                Destaque
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || uploading || !form.name || !form.price}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#D9D0B5', color: '#181818' }}
              >
                {uploading ? 'A carregar imagem...' : isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}