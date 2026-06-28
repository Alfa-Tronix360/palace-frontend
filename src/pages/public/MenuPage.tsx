import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import Fuse from 'fuse.js'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/api/http'
import { MENU_CATEGORY_LABELS } from '@/lib/constants'
import { formatCurrency, cn } from '@/lib/utils'
import { ProductImageCard } from '@/components/ui/product-image-card'
import { ShuffleHero } from '@/components/ui/shuffle-grid'
import type { MenuCategory } from '@/types'

/* ── Image map — cada item usa uma das imagens da galeria ───────────────── */
const itemImages: Record<string, string[]> = {
  'mi-1': ['/images/gallery-05.png', '/images/gallery-06.png'],
  'mi-2': ['/images/gallery-06.png', '/images/gallery-07.png'],
  'mi-3': ['/images/gallery-07.png', '/images/gallery-08.png'],
  'mi-4': ['/images/gallery-08.png', '/images/gallery-05.png'],
  'mi-5': ['/images/gallery-09.png', '/images/gallery-10.png'],
  'mi-6': ['/images/gallery-10.png', '/images/gallery-11.png'],
  'mi-7': ['/images/gallery-11.png', '/images/gallery-09.png'],
  'mi-8': ['/images/gallery-12.png', '/images/gallery-13.png'],
  'mi-9': ['/images/gallery-13.png', '/images/gallery-14.png'],
  'mi-10': ['/images/gallery-14.png', '/images/gallery-15.png'],
  'mi-11': ['/images/gallery-15.png', '/images/gallery-13.png'],
  'mi-12': ['/images/gallery-01.png'],
  'mi-13': ['/images/gallery-02.png'],
  'mi-14': ['/images/gallery-03.png'],
  'mi-15': ['/images/gallery-16.png', '/images/gallery-17.png'],
  'mi-16': ['/images/gallery-17.png', '/images/gallery-16.png'],
  'mi-17': ['/images/gallery-15.png'],
  'mi-18': ['/images/gallery-04.png'],
  'mi-19': ['/images/gallery-03.png', '/images/gallery-04.png'],
  'mi-20': ['/images/gallery-02.png', '/images/gallery-03.png'],
}

const categories = Object.keys(MENU_CATEGORY_LABELS) as MenuCategory[]

export default function MenuPage() {
  const { data: menuItems = [] } = useQuery({
    queryKey: ['public-menu'],
    queryFn: () => http.get<unknown, any[]>('/menu'),
  })

  const fuse = new Fuse(menuItems, {
    keys: ['name', 'description', 'category'],
    threshold: 0.35,
  })
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = menuItems
    if (search.trim()) {
      items = fuse.search(search.trim()).map(r => r.item)
    } else if (activeCategory !== 'all') {
      items = menuItems.filter(i => i.category === activeCategory)
    }
    return items
  }, [search, activeCategory])

  const selected = selectedId ? menuItems.find(i => i.id === selectedId) : null

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#B89A67' }}>
            Palace Lounge
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground">Cardápio</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Uma seleção cuidada de pratos, bebidas e cocktails que homenageiam a gastronomia internacional e angolana.
          </p>
        </motion.div>
      </section>

      {/* Search + Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Search bar */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all') }}
            placeholder="Pesquisar pratos, bebidas…"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>
              Todos
            </TabButton>
            {categories.map(cat => (
              <TabButton key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>
                {MENU_CATEGORY_LABELS[cat]}
              </TabButton>
            ))}
          </div>
        )}
      </section>

      {/* Item detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <ProductImageCard
                title={selected.name}
                price={formatCurrency(selected.price)}
                description={selected.description}
                images={[
                  ...(selected.imageUrl ? [{ src: selected.imageUrl, alt: selected.name }] : []),
                  ...(selected.images ?? []).map((src: string) => ({ src, alt: selected.name })),
                  ...((selected.imageUrl || (selected.images?.length ?? 0) > 0) ? [] : (itemImages[selected.id] ?? ['/images/gallery-01.png']).map((src: string) => ({ src, alt: selected.name }))),
                ]}
              />
              <button
                onClick={() => setSelectedId(null)}
                className="mt-3 w-full py-2 rounded-lg bg-surface/80 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">Nenhum resultado encontrado</p>
            <button onClick={() => setSearch('')} className="text-sm text-primary hover:underline">Limpar pesquisa</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(item.id)}
                className="group text-left rounded-xl overflow-hidden border border-border/40 bg-surface hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl ?? (itemImages[item.id] ?? ['/images/gallery-01.png'])[0]}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {item.featured && (
                    <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#B89A67', color: '#181818' }}>
                      Destaque
                    </span>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs text-white font-medium bg-black/60 px-2 py-1 rounded">Indisponível</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                    {MENU_CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                  <p className="text-sm font-semibold mt-1.5" style={{ color: '#B89A67' }}>
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Shuffle CTA */}
      <div className="border-t border-border/40 bg-surface/30">
        <ShuffleHero
          tag="Os nossos espaços"
          title="Cada visita é uma nova experiência"
          description="Reserve a sua mesa e descubra o Palace Lounge em toda a sua sofisticação."
          ctaLabel="Reservar Agora"
          ctaHref="/contactos"
        />
      </div>

    </div>
  )
}

/* ── Tab button ──────────────────────────────────────────────────────────── */
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
        active
          ? 'text-primary-foreground border-transparent'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
      style={active ? { backgroundColor: '#D9D0B5', color: '#181818' } : {}}
    >
      {children}
    </button>
  )
}
