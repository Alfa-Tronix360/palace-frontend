import { motion } from 'framer-motion'
import { SiteImagesManager } from '@/features/admin-images/components/SiteImagesManager'

export default function AdminImagesPage() {
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: '#B89A67' }}>Gestão</p>
                <h1 className="font-display text-3xl text-primary">Imagens do Site</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Substitua qualquer imagem usada nas páginas públicas do site. As imagens não trocadas continuam a usar o padrão de origem.
                </p>
            </motion.div>

            <SiteImagesManager />
        </div>
    )
}
