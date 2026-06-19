import { useQuery } from '@tanstack/react-query'
import { siteImagesAdapter } from '@/services/adapters/site-images.adapter'
import { SITE_IMAGE_SLOTS, type SiteImageKey } from '@/lib/site-images.constants'

/**
 * Uso em qualquer página:
 *
 *   const { resolve } = useSiteImages()
 *   <img src={resolve('gallery-03')} />
 *
 * Devolve o URL substituído pelo admin (se existir) ou o caminho padrão da constante.
 */
export function useSiteImages() {
  const { data = [] } = useQuery({
    queryKey: ['site-images'],
    queryFn: () => siteImagesAdapter.getAll(),
  })

  const overrides = new Map(data.map(img => [img.key, img.imageUrl]))

  function resolve(key: SiteImageKey): string {
    const slot = SITE_IMAGE_SLOTS.find(s => s.key === key)
    return overrides.get(key) ?? slot?.defaultUrl ?? ''
  }

  return { resolve }
}