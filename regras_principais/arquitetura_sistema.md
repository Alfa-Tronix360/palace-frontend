# Arquitetura do Sistema — Reserva.ao / Palace Lounge

---

## 0. Premissa: Mock Data First

Todo o desenvolvimento começa com dados simulados.
Nenhuma integração real de backend é necessária para as fases 1–3.

### Princípio central

```
Componente → Hook → Service → Mock Adapter
                                    ↓
                              (futuramente)
                              API Adapter → Backend Real
```

Os componentes nunca chamam dados directamente.
Os hooks abstraem a fonte de dados.
Os services contêm a lógica de negócio.
Os adapters são os únicos ficheiros que mudam quando o backend chegar.

### Localização dos mocks

```
src/data/
├── mock-reservations.ts
├── mock-menu.ts
├── mock-events.ts
├── mock-clients.ts
├── mock-tables.ts
├── mock-payments.ts
├── mock-reviews.ts
└── index.ts
```

### Contrato do adapter

```typescript
// src/services/adapters/reservations.adapter.ts
// Fase 1: retorna mock
// Fase 2: retorna fetch real — interface idêntica
export interface ReservationsAdapter {
  getAll(): Promise<Reservation[]>
  getById(id: string): Promise<Reservation>
  create(data: CreateReservationDTO): Promise<Reservation>
  update(id: string, data: UpdateReservationDTO): Promise<Reservation>
  cancel(id: string): Promise<void>
}
```

TanStack Query faz cache dos dados mock com os mesmos `queryKey` que usará com dados reais.
A troca de adapter não afecta nenhum componente.

---

## 1. Estrutura de Pastas Enterprise

```
src/
│
├── assets/
│   ├── images/
│   │   ├── logo.jpeg
│   │   ├── hero/
│   │   ├── menu/
│   │   └── gallery/
│   └── fonts/
│
├── components/                        # Componentes partilhados, sem lógica de negócio
│   ├── ui/                            # Shadcn/UI base — nunca editar directamente
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   └── toast.tsx
│   │
│   ├── layout/
│   │   ├── PublicNavbar.tsx            # Navbar das páginas públicas
│   │   ├── ClientNavbar.tsx            # Navbar da área de cliente
│   │   ├── AdminSidebar.tsx            # Sidebar do painel admin
│   │   ├── AdminTopbar.tsx             # Topbar do admin (breadcrumb, user)
│   │   ├── Footer.tsx                  # Footer global
│   │   ├── PageWrapper.tsx             # Wrapper com padding e max-width
│   │   └── SectionWrapper.tsx          # Wrapper de secção com espaçamento
│   │
│   ├── cards/
│   │   ├── MenuItemCard.tsx            # Card de produto do cardápio
│   │   ├── ReservationCard.tsx         # Card de reserva (cliente)
│   │   ├── EventCard.tsx               # Card de evento
│   │   ├── ReviewCard.tsx              # Card de avaliação
│   │   └── StatCard.tsx                # Card de KPI (dashboard)
│   │
│   ├── tables/
│   │   ├── DataTable.tsx               # Wrapper TanStack Table reutilizável
│   │   ├── DataTableToolbar.tsx        # Filtros + pesquisa da tabela
│   │   ├── DataTablePagination.tsx
│   │   └── DataTableColumnHeader.tsx
│   │
│   └── forms/
│       ├── FormField.tsx               # Wrapper com label + error
│       ├── DatePickerField.tsx         # React Day Picker integrado com RHF
│       ├── TimePickerField.tsx
│       ├── GuestCounterField.tsx
│       └── ImageUploadField.tsx        # React Dropzone integrado com RHF
│
├── features/                          # Domínios de negócio — cada feature é auto-contida
│   │
│   ├── landing/
│   │   ├── components/
│   │   │   ├── HeroSection.tsx         # Vídeo background + CTA
│   │   │   ├── HighlightsSection.tsx   # 3 pilares: Ambiente, Gastronomia, Serviço
│   │   │   ├── MenuPreviewSection.tsx  # 4–6 pratos em destaque
│   │   │   ├── EventsCTASection.tsx    # Banner de eventos privados
│   │   │   ├── GalleryPreviewSection.tsx
│   │   │   ├── ReviewsSection.tsx
│   │   │   └── ContactSection.tsx      # Mapa + info
│   │   └── index.ts
│   │
│   ├── menu/
│   │   ├── components/
│   │   │   ├── MenuCategoryTabs.tsx
│   │   │   ├── MenuGrid.tsx
│   │   │   ├── MenuItemDetail.tsx      # Modal de detalhe
│   │   │   └── MenuSearchBar.tsx       # Fuse.js
│   │   ├── hooks/
│   │   │   └── useMenu.ts
│   │   └── index.ts
│   │
│   ├── gallery/
│   │   ├── components/
│   │   │   ├── MasonryGallery.tsx
│   │   │   └── ImageLightbox.tsx
│   │   └── index.ts
│   │
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPasswordForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── index.ts
│   │
│   ├── reservations/
│   │   ├── components/
│   │   │   ├── ReservationWizard.tsx   # Multi-step: data → hora → mesa → confirm
│   │   │   ├── StepSelectDate.tsx
│   │   │   ├── StepSelectTime.tsx
│   │   │   ├── StepSelectTable.tsx
│   │   │   ├── StepConfirm.tsx
│   │   │   ├── ReservationList.tsx     # Vista do cliente
│   │   │   ├── ReservationStatusBadge.tsx
│   │   │   └── CancelReservationDialog.tsx
│   │   ├── hooks/
│   │   │   └── useReservations.ts
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── components/
│   │   │   ├── EventRequestForm.tsx
│   │   │   ├── EventTypeSelector.tsx
│   │   │   ├── EventList.tsx
│   │   │   └── EventStatusBadge.tsx
│   │   ├── hooks/
│   │   │   └── useEvents.ts
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── VIPBadge.tsx
│   │   │   ├── ReservationHistory.tsx
│   │   │   └── ReviewHistory.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   └── index.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── KPIGrid.tsx             # 8 métricas do dia
│   │   │   ├── ReservationsChart.tsx   # Recharts — reservas/mês
│   │   │   ├── RevenueChart.tsx        # Recharts — receita
│   │   │   ├── OccupancyChart.tsx      # Recharts — ocupação mesas
│   │   │   ├── RecentReservations.tsx
│   │   │   └── AlertsPanel.tsx
│   │   ├── hooks/
│   │   │   └── useDashboard.ts
│   │   └── index.ts
│   │
│   ├── admin-reservations/
│   │   ├── components/
│   │   │   ├── ReservationsTable.tsx   # TanStack Table
│   │   │   ├── CreateReservationForm.tsx
│   │   │   ├── EditReservationForm.tsx
│   │   │   └── ReservationFilters.tsx
│   │   ├── hooks/
│   │   │   └── useAdminReservations.ts
│   │   └── index.ts
│   │
│   ├── admin-clients/
│   │   ├── components/
│   │   │   ├── ClientsTable.tsx
│   │   │   ├── ClientDetail.tsx
│   │   │   ├── ClientVIPBadge.tsx
│   │   │   └── ClientHistoryPanel.tsx
│   │   ├── hooks/
│   │   │   └── useAdminClients.ts
│   │   └── index.ts
│   │
│   ├── admin-events/
│   │   ├── components/
│   │   │   ├── EventsTable.tsx
│   │   │   ├── EventDetail.tsx
│   │   │   ├── ApproveEventDialog.tsx
│   │   │   └── EventPaymentPanel.tsx
│   │   ├── hooks/
│   │   │   └── useAdminEvents.ts
│   │   └── index.ts
│   │
│   ├── admin-menu/
│   │   ├── components/
│   │   │   ├── MenuItemsTable.tsx
│   │   │   ├── CreateMenuItemForm.tsx
│   │   │   ├── EditMenuItemForm.tsx
│   │   │   └── ToggleAvailability.tsx
│   │   ├── hooks/
│   │   │   └── useAdminMenu.ts
│   │   └── index.ts
│   │
│   ├── admin-payments/
│   │   ├── components/
│   │   │   ├── PaymentsTable.tsx
│   │   │   ├── PaymentStatusBadge.tsx
│   │   │   └── ConfirmPaymentDialog.tsx
│   │   ├── hooks/
│   │   │   └── useAdminPayments.ts
│   │   └── index.ts
│   │
│   └── admin-reports/
│       ├── components/
│       │   ├── ReportFilters.tsx
│       │   ├── DailyRevenueReport.tsx
│       │   ├── MonthlyRevenueReport.tsx
│       │   ├── OccupancyReport.tsx
│       │   ├── TopClientsReport.tsx
│       │   └── CancellationsReport.tsx
│       ├── hooks/
│       │   └── useReports.ts
│       └── index.ts
│
├── pages/                             # Apenas composição de features + layouts
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── MenuPage.tsx
│   │   ├── GalleryPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   │
│   ├── client/
│   │   ├── ClientDashboardPage.tsx
│   │   ├── ClientReservationsPage.tsx
│   │   ├── ClientEventsPage.tsx
│   │   └── ClientProfilePage.tsx
│   │
│   └── admin/
│       ├── AdminDashboardPage.tsx
│       ├── AdminReservationsPage.tsx
│       ├── AdminClientsPage.tsx
│       ├── AdminEventsPage.tsx
│       ├── AdminMenuPage.tsx
│       ├── AdminPaymentsPage.tsx
│       └── AdminReportsPage.tsx
│
├── hooks/                             # Hooks transversais (não ligados a uma feature)
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── useScrollDirection.ts
│
├── services/                          # Lógica de acesso a dados
│   ├── adapters/
│   │   ├── reservations.adapter.ts    # Interface + mock / real
│   │   ├── menu.adapter.ts
│   │   ├── events.adapter.ts
│   │   ├── clients.adapter.ts
│   │   └── payments.adapter.ts
│   └── api/                           # Futura integração REST/GraphQL
│       └── http.ts                    # Axios instance (base URL, interceptors)
│
├── store/                             # Zustand stores
│   ├── auth.store.ts
│   ├── theme.store.ts
│   └── reservation-wizard.store.ts
│
├── data/                              # Mock data (fase 1)
│   ├── mock-reservations.ts
│   ├── mock-menu.ts
│   ├── mock-events.ts
│   ├── mock-clients.ts
│   ├── mock-tables.ts
│   ├── mock-payments.ts
│   ├── mock-reviews.ts
│   └── index.ts
│
├── lib/
│   ├── utils.ts                       # cn(), formatDate(), formatCurrency(AOA)
│   ├── validators.ts                  # Schemas Zod reutilizáveis
│   ├── constants.ts                   # ROUTES, STATUS, CATEGORIES, PAYMENT_METHODS
│   └── query-client.ts               # TanStack QueryClient config
│
├── types/                             # Tipos e interfaces globais
│   ├── user.types.ts
│   ├── reservation.types.ts
│   ├── event.types.ts
│   ├── menu.types.ts
│   ├── payment.types.ts
│   ├── review.types.ts
│   └── index.ts
│
├── routes/
│   ├── index.tsx                      # React Router — createBrowserRouter
│   ├── PublicLayout.tsx               # Navbar pública + Footer + Outlet
│   ├── ClientLayout.tsx               # Navbar cliente + Outlet (auth guard)
│   ├── AdminLayout.tsx                # Sidebar admin + Topbar + Outlet (role guard)
│   ├── PrivateRoute.tsx               # Guard: isAuthenticated
│   └── AdminRoute.tsx                 # Guard: role === 'admin'
│
└── main.tsx
```

---

## 2. Estratégia de Componentes

### Níveis de componente

```
Nível 1 — UI Primitivos (src/components/ui/)
  └─ Shadcn/UI: Button, Input, Dialog, Badge…
     Regra: nunca editar. Criar wrappers se necessário.

Nível 2 — Componentes Partilhados (src/components/)
  └─ Cards, Tables, Forms, Layout
     Regra: sem lógica de negócio. Recebem tudo via props.

Nível 3 — Componentes de Feature (src/features/*/components/)
  └─ Conectados a hooks com dados reais/mock
     Regra: conhecem o domínio mas não fazem fetch directamente.

Nível 4 — Páginas (src/pages/)
  └─ Apenas composição. Sem lógica própria.
     Regra: cada página = layout + 1 a 3 features.
```

### Convenção de nomenclatura

```
PascalCase        → componentes React     (MenuItemCard.tsx)
camelCase         → hooks                 (useReservations.ts)
camelCase         → stores                (auth.store.ts)
camelCase         → services              (reservations.adapter.ts)
SCREAMING_SNAKE   → constantes            (RESERVATION_STATUS)
kebab-case        → ficheiros CSS/config  (tailwind.config.ts)
```

### Contrato de props

```typescript
// Cada componente de feature exporta o seu tipo de props
interface MenuItemCardProps {
  item: MenuItem
  onSelect?: (item: MenuItem) => void
  variant?: 'default' | 'featured' | 'compact'
}

// Componentes de tabela recebem colunas + dados tipados
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  searchKey?: keyof TData
  isLoading?: boolean
}
```

### Componentes dos prompts de customização

Os prompts em `costumizacao_sistema/` são integrados como:

| Prompt | Feature de destino | Componente final |
|---|---|---|
| `promptHero.md` | `landing/` | `HeroSection.tsx` |
| `promptCatalogo.md` | `menu/`, `gallery/` | `MenuGrid.tsx`, `MasonryGallery.tsx` |
| `promptCard.md` | `components/cards/` | `MenuItemCard.tsx`, `EventCard.tsx` |
| `promptFooter.md` | `components/layout/` | `Footer.tsx` |
| `promptLaayout.md` | `gallery/` | `MasonryGallery.tsx` |
| `promptTable.md` | `components/tables/` | `DataTable.tsx` |
| `promptDetalheProduto` | `menu/` | `MenuItemDetail.tsx` |
| `promptChatCometarioAvaliacao.md` | `profile/` | `ReviewCard.tsx` |
| `promptMap.md` | `landing/` | `ContactSection.tsx` |
| `promptTestevendidosCacelados.md` | `admin-reports/` | tabelas de comparação |

---

## 3. Estratégia de Rotas

### Configuração com createBrowserRouter

```
src/routes/index.tsx

Root
├── PublicLayout            (Navbar pública + Footer)
│   ├── /                  → HomePage
│   ├── /sobre             → AboutPage
│   ├── /menu              → MenuPage
│   ├── /galeria           → GalleryPage
│   ├── /contactos         → ContactsPage
│   ├── /login             → LoginPage
│   └── /registo           → RegisterPage
│
├── ClientLayout            (Navbar cliente + PrivateRoute)
│   ├── /cliente           → ClientDashboardPage
│   ├── /cliente/reservas  → ClientReservationsPage
│   ├── /cliente/eventos   → ClientEventsPage
│   └── /cliente/perfil    → ClientProfilePage
│
└── AdminLayout             (Sidebar + AdminRoute)
    ├── /admin             → AdminDashboardPage
    ├── /admin/reservas    → AdminReservationsPage
    ├── /admin/clientes    → AdminClientsPage
    ├── /admin/eventos     → AdminEventsPage
    ├── /admin/cardapio    → AdminMenuPage
    ├── /admin/pagamentos  → AdminPaymentsPage
    └── /admin/relatorios  → AdminReportsPage
```

### Guards de autenticação

```
PrivateRoute
  → lê auth.store → isAuthenticated
  → false: redirect para /login com ?returnTo=<rota actual>

AdminRoute
  → lê auth.store → role
  → role !== 'admin': redirect para /cliente
```

### Lazy loading por grupo de rotas

```typescript
// Carregamento lazy por grupo
const AdminLayout   = lazy(() => import('./AdminLayout'))
const ClientLayout  = lazy(() => import('./ClientLayout'))

// Cada página também lazy
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
```

Páginas públicas carregam imediatamente (critical path).
Área cliente e admin carregam sob demanda.

### Constantes de rotas

```typescript
// src/lib/constants.ts
export const ROUTES = {
  HOME: '/',
  ABOUT: '/sobre',
  MENU: '/menu',
  GALLERY: '/galeria',
  CONTACTS: '/contactos',
  LOGIN: '/login',
  REGISTER: '/registo',
  CLIENT: {
    DASHBOARD: '/cliente',
    RESERVATIONS: '/cliente/reservas',
    EVENTS: '/cliente/eventos',
    PROFILE: '/cliente/perfil',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    RESERVATIONS: '/admin/reservas',
    CLIENTS: '/admin/clientes',
    EVENTS: '/admin/eventos',
    MENU: '/admin/cardapio',
    PAYMENTS: '/admin/pagamentos',
    REPORTS: '/admin/relatorios',
  },
} as const
```

Nunca usar strings mágicas de rota nos componentes.

---

## 4. Estratégia de Estado Global

### Divisão de responsabilidades

```
Estado de servidor    → TanStack Query   (dados remotos/mock: reservas, menu…)
Estado de sessão      → Zustand          (auth, tema, wizard de reserva)
Estado de UI local    → useState         (modal aberto, tab activa, hover)
Estado de formulário  → React Hook Form  (campos, erros, submit)
```

### auth.store.ts

```typescript
interface AuthStore {
  user: User | null
  token: string | null
  role: 'admin' | 'client' | null
  isAuthenticated: boolean

  login(user: User, token: string): void
  logout(): void
}
// Persistido em localStorage via zustand/middleware persist
```

### theme.store.ts

```typescript
interface ThemeStore {
  theme: 'dark' | 'light'
  toggleTheme(): void
}
// Default: 'dark' (Palace Lounge premium)
// Sincroniza com class="dark" no <html>
```

### reservation-wizard.store.ts

```typescript
interface ReservationWizardStore {
  step: 1 | 2 | 3 | 4
  date: Date | null
  time: string | null
  guests: number
  tableId: string | null

  setStep(step: number): void
  setDate(date: Date): void
  setTime(time: string): void
  setGuests(count: number): void
  setTable(id: string): void
  reset(): void
}
// Estado em memória — não persistido
// Limpo após confirmação ou abandono
```

### TanStack Query — query keys

```typescript
// Convenção de query keys
export const queryKeys = {
  reservations: {
    all: ['reservations'] as const,
    list: (filters: ReservationFilters) => ['reservations', 'list', filters] as const,
    detail: (id: string) => ['reservations', 'detail', id] as const,
  },
  menu: {
    all: ['menu'] as const,
    byCategory: (category: MenuCategory) => ['menu', 'category', category] as const,
    detail: (id: string) => ['menu', 'detail', id] as const,
  },
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
  },
  events: {
    all: ['events'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  dashboard: {
    kpis: ['dashboard', 'kpis'] as const,
    charts: (period: string) => ['dashboard', 'charts', period] as const,
  },
}
```

---

## 5. Estratégia de Chamadas API

### Camadas de acesso a dados

```
Componente
    ↓ chama
Hook de feature  (ex: useReservations)
    ↓ usa
TanStack Query   (useQuery / useMutation)
    ↓ chama
Service Adapter  (reservations.adapter.ts)
    ↓ resolve via
Mock Data        (Fase 1)  ←→  HTTP Client (Fase futura)
```

### Estrutura de um hook de feature

```typescript
// src/features/reservations/hooks/useReservations.ts

export function useReservations(filters?: ReservationFilters) {
  return useQuery({
    queryKey: queryKeys.reservations.list(filters ?? {}),
    queryFn: () => reservationsAdapter.getAll(filters),
    staleTime: 1000 * 60 * 2,   // 2 min
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: queryKeys.reservations.detail(id),
    queryFn: () => reservationsAdapter.getById(id),
    enabled: !!id,
  })
}

export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateReservationDTO) => reservationsAdapter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
      toast.success('Reserva criada com sucesso.')
    },
    onError: () => {
      toast.error('Erro ao criar reserva. Tente novamente.')
    },
  })
}
```

### Mock Adapter (Fase 1)

```typescript
// src/services/adapters/reservations.adapter.ts

import { mockReservations } from '@/data/mock-reservations'
import type { ReservationsAdapter } from './types'

// Simula latência de rede
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

export const reservationsAdapter: ReservationsAdapter = {
  async getAll(filters) {
    await delay()
    let data = [...mockReservations]
    if (filters?.status) data = data.filter(r => r.status === filters.status)
    if (filters?.date)   data = data.filter(r => isSameDay(r.date, filters.date!))
    return data
  },
  async getById(id) {
    await delay()
    const r = mockReservations.find(r => r.id === id)
    if (!r) throw new Error('Reserva não encontrada')
    return r
  },
  async create(data) {
    await delay(600)
    const newReservation = { ...data, id: crypto.randomUUID(), status: 'pending' as const }
    mockReservations.push(newReservation)
    return newReservation
  },
  async cancel(id) {
    await delay()
    const r = mockReservations.find(r => r.id === id)
    if (r) r.status = 'cancelled'
  },
}
```

### HTTP Client (preparado para Fase futura)

```typescript
// src/services/api/http.ts
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
})

http.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)
```

### Tratamento de erros

```
Erro de rede / timeout     → Sonner toast.error genérico
Erro de validação (400)    → Mostrado inline no formulário via React Hook Form
Não autorizado (401)       → logout + redirect para /login
Sem permissão (403)        → Redirect para página anterior
Não encontrado (404)       → NotFoundPage
Servidor (500)             → Toast erro + opção de retry (TanStack Query)
```

---

## 6. Plano de Implementação por Módulos

### Fase 0 — Setup (pré-requisito de tudo)

```
[ ] Inicializar projecto Vite + React 19 + TypeScript
[ ] Configurar Tailwind CSS 4 com tokens Palace Lounge
[ ] Instalar e configurar Shadcn/UI
[ ] Configurar React Router com createBrowserRouter
[ ] Configurar TanStack Query (QueryClient + QueryClientProvider)
[ ] Configurar Zustand (auth, theme, wizard)
[ ] Configurar Sonner (Toaster global)
[ ] Configurar ESLint + Prettier + Husky
[ ] Criar estrutura de pastas completa
[ ] Criar src/lib/constants.ts (ROUTES, STATUS, etc.)
[ ] Criar src/types/index.ts (todos os tipos)
[ ] Criar src/data/ com mock data inicial
[ ] Criar src/services/adapters/ com mock adapters
[ ] Configurar variáveis de ambiente (.env)
```

---

### Fase 1 — Landing Page + Páginas Públicas

**Módulo 1.1 — Fundação visual**
```
[ ] Configurar design tokens (CSS variables dark/light)
[ ] Criar PublicLayout (Navbar + Footer)
[ ] PublicNavbar com logo + navegação + botão Reservar
[ ] Footer animado (promptFooter.md)
[ ] Configurar Framer Motion (AnimatePresence, transições de página)
```

**Módulo 1.2 — Landing Page (/)**
```
[ ] HeroSection (promptHero.md — vídeo background + CTA)
[ ] HighlightsSection (3 cards: Ambiente, Gastronomia, Serviço)
[ ] MenuPreviewSection (6 pratos em destaque — Glass Cards)
[ ] EventsCTASection (banner eventos privados)
[ ] GalleryPreviewSection (6 imagens masonry)
[ ] ReviewsSection (avaliações estáticas)
[ ] ContactSection (mapa MapLibre + info)
```

**Módulo 1.3 — Páginas informativas**
```
[ ] AboutPage (/sobre)
[ ] MenuPage (/menu) — catálogo + filtros + pesquisa Fuse.js + modal detalhe
[ ] GalleryPage (/galeria) — masonry completo + lightbox
[ ] ContactsPage (/contactos) — mapa + formulário
```

**Módulo 1.4 — Autenticação**
```
[ ] LoginPage (/login)
[ ] RegisterPage (/registo)
[ ] auth.store com persistência
[ ] PrivateRoute + AdminRoute
```

---

### Fase 2 — Dashboard Administrativo

**Módulo 2.1 — Layout Admin**
```
[ ] AdminLayout (Sidebar + Topbar + Outlet)
[ ] AdminSidebar com navegação e indicadores activos
[ ] AdminTopbar com breadcrumb e user menu
[ ] AdminRoute guard
```

**Módulo 2.2 — Dashboard (/admin)**
```
[ ] KPIGrid (8 métricas: reservas do dia, clientes, eventos, receita diária/mensal, ocupação, cancelamentos, VIPs)
[ ] ReservationsChart (Recharts — barras por mês)
[ ] RevenueChart (Recharts — linha de receita)
[ ] OccupancyChart (Recharts — pizza de ocupação)
[ ] RecentReservations (tabela resumida)
[ ] AlertsPanel (reservas pendentes, pagamentos a confirmar)
```

**Módulo 2.3 — Gestão de Reservas (/admin/reservas)**
```
[ ] DataTable com TanStack Table (sort, filter, paginação, pesquisa)
[ ] Filtros: estado, data, cliente
[ ] Criar reserva (form + dialog)
[ ] Editar reserva (drawer lateral)
[ ] Confirmar / Cancelar reserva (dialog de confirmação)
[ ] ReservationStatusBadge com cores por estado
```

**Módulo 2.4 — Gestão de Clientes (/admin/clientes)**
```
[ ] ClientsTable com pesquisa Fuse.js
[ ] ClientDetail (drawer: histórico, total gasto, VIP)
[ ] VIPBadge + classificação automática
```

**Módulo 2.5 — Gestão de Eventos (/admin/eventos)**
```
[ ] EventsTable com filtros de estado e tipo
[ ] EventDetail com fluxo de aprovação
[ ] ApproveEventDialog
[ ] EventPaymentPanel
```

**Módulo 2.6 — Gestão de Cardápio (/admin/cardapio)**
```
[ ] MenuItemsTable por categoria
[ ] Criar/Editar item (form com upload de imagem — React Dropzone)
[ ] Toggle disponibilidade inline
[ ] Atualizar preços
```

**Módulo 2.7 — Gestão Financeira (/admin/pagamentos)**
```
[ ] PaymentsTable com filtros de método e estado
[ ] ConfirmPaymentDialog
[ ] PaymentStatusBadge
```

**Módulo 2.8 — Relatórios (/admin/relatorios)**
```
[ ] ReportFilters (período, tipo)
[ ] DailyRevenueReport
[ ] MonthlyRevenueReport
[ ] OccupancyReport
[ ] TopClientsReport
[ ] CancellationsReport
```

---

### Fase 3 — Sistema de Reservas (Cliente)

**Módulo 3.1 — Layout Cliente**
```
[ ] ClientLayout (Navbar cliente + Outlet)
[ ] ClientNavbar com perfil e notificações
[ ] ClientRoute guard
```

**Módulo 3.2 — Fluxo de Reserva**
```
[ ] ReservationWizard (4 passos)
[ ] Step 1: Seleccionar data (React Day Picker)
[ ] Step 2: Seleccionar hora (slots disponíveis)
[ ] Step 3: Seleccionar mesa (mapa visual das mesas)
[ ] Step 4: Confirmar + pagamento opcional
[ ] reservation-wizard.store (estado do fluxo)
[ ] Confirmação com código de reserva
[ ] useCreateReservation mutation
```

**Módulo 3.3 — Área do Cliente**
```
[ ] ClientDashboardPage (próximas reservas + acções rápidas)
[ ] ClientReservationsPage (lista + histórico + cancelar)
[ ] ClientEventsPage (pedidos + estado)
[ ] ClientProfilePage (dados pessoais + VIP + avaliações)
```

**Módulo 3.4 — Avaliações**
```
[ ] ReviewForm após reserva concluída (1–5 estrelas + 4 atributos)
[ ] ReviewCard (comentário + nota)
[ ] ReviewHistory no perfil
```

---

### Ordem de prioridade por valor de negócio

```
Prioridade 1  →  Fase 0 + Fase 1.1 + Fase 1.2   (visibilidade imediata do produto)
Prioridade 2  →  Fase 1.3 + Fase 1.4             (conteúdo completo + acesso)
Prioridade 3  →  Fase 2.1 + Fase 2.2 + Fase 2.3 (operações admin core)
Prioridade 4  →  Fase 2.4 → Fase 2.8             (gestão completa admin)
Prioridade 5  →  Fase 3                           (self-service do cliente)
```

---

## Resumo de Dependências

```
Fase 0 (setup)
    ↓
Fase 1.1 (fundação visual) ←── bloqueante para tudo o que se segue
    ↓
Fase 1.2 (landing) ── paralelo com ── Fase 1.3 (páginas info)
    ↓
Fase 1.4 (auth) ←── bloqueante para Fase 2 e 3
    ↓
Fase 2.1 (layout admin) ←── bloqueante para todos os módulos 2.x
    ↓
Módulos 2.2 → 2.8 (podem ser desenvolvidos em paralelo após 2.1)
    ↓
Fase 3.1 (layout cliente) ←── bloqueante para módulos 3.x
    ↓
Módulos 3.2 → 3.4 (sequenciais — wizard precede a área do cliente)
```
# Backend Futuro - Requisitos Operacionais

O frontend continua mock-first. A equipa do backend deve entregar APIs estaveis para substituir os adapters sem mudar componentes.

Papeis obrigatorios: `admin`, `client` e `staff`. O papel `staff` e a conta operacional que valida QR codes na entrada.

O backend deve cobrir:

- autenticacao com login, refresh token, logout, RBAC e auditoria;
- areas geometricas editaveis do mapa do Palace;
- mesas dentro de areas, com posicao x/y, status, capacidade, zona, imagem e descricao;
- reservas com bloqueio contra dupla marcacao de mesa no mesmo horario;
- eventos privados solicitados por cliente;
- eventos publicados pelo admin para venda de convites digitais;
- snapshot dos lugares de cada evento publicado;
- compra de convite com QR code unico;
- validacao de QR por staff, com historico de leitura;
- relatorios de receita, top clientes, mesas mais reservadas, mesas mais vendidas, receita por mesa, ocupacao por area e validacoes por evento.

Endpoints esperados:

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me

GET    /venue/areas
POST   /venue/areas
PATCH  /venue/areas/:id
DELETE /venue/areas/:id

GET    /venue/tables
POST   /venue/tables
PATCH  /venue/tables/:id
DELETE /venue/tables/:id
GET    /venue/tables/availability?date=&time=&guests=

GET    /reservations
POST   /reservations
PATCH  /reservations/:id
POST   /reservations/:id/cancel
POST   /reservations/:id/confirm

GET    /published-events
POST   /published-events
PATCH  /published-events/:id
POST   /published-events/:id/publish
POST   /published-events/:id/unpublish
GET    /published-events/:id/seats

POST /tickets/purchase
GET  /tickets/my
POST /tickets/validate
GET  /tickets/scan-history

GET /reports/revenue?from=&to=
GET /reports/top-clients?from=&to=
GET /reports/tables/reservations?from=&to=
GET /reports/tables/ticket-sales?from=&to=
GET /reports/areas/occupancy?from=&to=
GET /reports/events/sales?from=&to=
GET /reports/tickets/validation?eventId=
```

---
