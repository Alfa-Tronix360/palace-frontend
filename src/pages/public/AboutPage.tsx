import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Masonry, GalleryImage } from '@/components/ui/masonry'
import { ROUTES } from '@/lib/constants'
import { useSiteImages } from '@/hooks/useSiteImages'
import type { SiteImageKey } from '@/lib/site-images.constants'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55 } }),
}

const timeline = [
  { year: '2018', title: 'Fundação', desc: 'O Palace Lounge abre as portas em Luanda com uma visão clara: elevar a gastronomia angolana a um nível premium.' },
  { year: '2020', title: 'Expansão do Cardápio', desc: 'Introduzimos o programa de degustação e a carta de vinhos curada pelo nosso sommelier exclusivo.' },
  { year: '2022', title: 'Programa VIP', desc: 'Lançamos o programa de fidelidade Palace VIP, dedicado aos nossos clientes mais especiais.' },
  { year: '2024', title: 'Renovação', desc: 'Renovação completa do espaço interior e lançamento das reservas digitais.' },
]

const values = [
  { title: 'Excelência', desc: 'Cada detalhe é pensado para superar as expectativas. Da mise en place ao serviço personalizado.' },
  { title: 'Autenticidade', desc: 'Ingredientes selecionados, receitas que honram as tradições e inovação com identidade.' },
  { title: 'Exclusividade', desc: 'Um espaço para quem valoriza o requinte, a privacidade e as experiências verdadeiramente únicas.' },
]

const galleryKeys: SiteImageKey[] = [
  'gallery-01', 'gallery-02', 'gallery-03',
  'gallery-04', 'gallery-13', 'gallery-14',
  'gallery-15', 'gallery-16', 'gallery-17',
]

export default function AboutPage() {
  const { resolve } = useSiteImages()

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative h-[60vh] overflow-hidden">
        <img src={resolve('gallery-02')} alt="Palace Lounge" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#D9D0B5' }}>A nossa história</p>
            <h1 className="font-display text-4xl md:text-6xl text-white">Sobre o Palace Lounge</h1>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-xs tracking-[0.3em] uppercase mb-4" style={{ color: '#B89A67' }}>Quem somos</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6 leading-tight">
              O melhor da gastronomia premium em Luanda
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>O Palace Lounge nasceu da paixão por criar momentos inesquecíveis. Desde a nossa fundação, temos sido o destino escolhido por executivos, famílias e casais que procuram uma experiência gastronómica à altura das melhores capitais do mundo.</p>
              <p>Localizado no coração de Luanda, o nosso restaurante combina um ambiente sofisticado com um serviço personalizado, uma cozinha criativa e uma curadoria de vinhos e cocktails que reflecte o melhor do mundo.</p>
              <p>Cada visita ao Palace é uma jornada sensorial — desde o acolhimento até à última sobremesa.</p>
            </div>
            <Link
              to={ROUTES.MENU}
              className="inline-flex items-center gap-2 mt-6 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#D9D0B5' }}
            >
              Explorar o cardápio <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <img src={resolve('gallery-03')} alt="Palace Lounge interior"
              className="rounded-2xl w-full h-[420px] object-cover border border-border/30" />
          </motion.div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-surface/50 border-y border-border/40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#B89A67' }}>Os nossos pilares</p>
            <h2 className="font-display text-3xl md:text-4xl text-foreground">Valores que nos guiam</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title} custom={i} variants={fadeUp}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="rounded-2xl border border-border/40 bg-background p-6 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #D9D0B5, #B89A67)' }}>
                  <span className="font-display text-lg font-bold text-charcoal">{v.title[0]}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#B89A67' }}>A nossa jornada</p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">Uma história de excelência</h2>
        </motion.div>
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
          {timeline.map((item, i) => (
            <motion.div
              key={item.year} custom={i} variants={fadeUp}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="relative flex gap-8 mb-8 last:mb-0"
            >
              <div className="relative z-10 w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0"
                style={{ borderColor: '#D9D0B5', backgroundColor: '#181818' }}>
                <span className="font-display text-sm font-bold" style={{ color: '#D9D0B5' }}>{item.year}</span>
              </div>
              <div className="pt-3 pb-8">
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Galeria masonry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: '#B89A67' }}>O nosso espaço</p>
          <h2 className="font-display text-3xl text-foreground">Imagens que contam a história</h2>
        </motion.div>
        <Masonry>
          {galleryKeys.map((key, i) => (
            <motion.div key={key} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
              <GalleryImage src={resolve(key)} alt={`Palace Lounge ${i + 1}`} />
            </motion.div>
          ))}
        </Masonry>
      </section>

    </div>
  )
}