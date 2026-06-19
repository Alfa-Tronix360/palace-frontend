// Lista central de todos os "espaços de imagem" editáveis do site.
// Cada slot tem uma chave única (key), um nome legível (label) e o caminho
// da imagem padrão (defaultUrl), usada enquanto o utilizador não substituir.
//
// Para adicionar um novo espaço de imagem em qualquer página, basta:
// 1. Adicionar uma entrada nova aqui.
// 2. Usar o hook useSiteImages().resolve('a-chave-nova') no componente da página.

export const SITE_IMAGE_SLOTS = [
  { key: 'gallery-01', label: 'Galeria — Foto 1 (também usada no Hero da Home)', defaultUrl: '/images/gallery-01.png' },
  { key: 'gallery-02', label: 'Galeria — Foto 2', defaultUrl: '/images/gallery-02.png' },
  { key: 'gallery-03', label: 'Galeria — Foto 3', defaultUrl: '/images/gallery-03.png' },
  { key: 'gallery-04', label: 'Galeria — Foto 4', defaultUrl: '/images/gallery-04.png' },
  { key: 'gallery-05', label: 'Galeria — Foto 5', defaultUrl: '/images/gallery-05.png' },
  { key: 'gallery-06', label: 'Galeria — Foto 6', defaultUrl: '/images/gallery-06.png' },
  { key: 'gallery-07', label: 'Galeria — Foto 7', defaultUrl: '/images/gallery-07.png' },
  { key: 'gallery-08', label: 'Galeria — Foto 8', defaultUrl: '/images/gallery-08.png' },
  { key: 'gallery-09', label: 'Galeria — Foto 9', defaultUrl: '/images/gallery-09.png' },
  { key: 'gallery-10', label: 'Galeria — Foto 10', defaultUrl: '/images/gallery-10.png' },
  { key: 'gallery-11', label: 'Galeria — Foto 11', defaultUrl: '/images/gallery-11.png' },
  { key: 'gallery-12', label: 'Galeria — Foto 12', defaultUrl: '/images/gallery-12.png' },
  { key: 'gallery-13', label: 'Galeria — Foto 13', defaultUrl: '/images/gallery-13.png' },
  { key: 'gallery-14', label: 'Galeria — Foto 14', defaultUrl: '/images/gallery-14.png' },
  { key: 'gallery-15', label: 'Galeria — Foto 15', defaultUrl: '/images/gallery-15.png' },
  { key: 'gallery-16', label: 'Galeria — Foto 16', defaultUrl: '/images/gallery-16.png' },
  { key: 'gallery-17', label: 'Galeria — Foto 17', defaultUrl: '/images/gallery-17.png' },
] as const

export type SiteImageKey = typeof SITE_IMAGE_SLOTS[number]['key']