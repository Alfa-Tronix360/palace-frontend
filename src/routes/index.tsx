import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PublicLayout } from './PublicLayout'
import { ClientLayout } from './ClientLayout'
import { AdminLayout } from './AdminLayout'
import { OperacionalLayout } from './OperacionalLayout'
// ─── Loader ──────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function wrap(Component: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// ─── Páginas públicas ─────────────────────────────────────────────────────────
const HomePage = lazy(() => import('@/pages/public/HomePage'))
const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
const MenuPage = lazy(() => import('@/pages/public/MenuPage'))
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'))
const ContactsPage = lazy(() => import('@/pages/public/ContactsPage'))
const LoginPage = lazy(() => import('@/pages/public/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'))
const ScannerPage = lazy(() => import('@/pages/staff/ScannerPage'))
const EventsPage = lazy(() => import('@/pages/public/EventsPage'))
// ─── Páginas do cliente ───────────────────────────────────────────────────────
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage'))
const ClientReservationsPage = lazy(() => import('@/pages/client/ClientReservationsPage'))
const ClientEventsPage = lazy(() => import('@/pages/client/ClientEventsPage'))
const ClientProfilePage = lazy(() => import('@/pages/client/ClientProfilePage'))
const AdminImagesPage = lazy(() => import('@/pages/admin/AdminImagesPage'))

// ─── Páginas de admin ─────────────────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminReservationsPage = lazy(() => import('@/pages/admin/AdminReservationsPage'))
const AdminTablesPage = lazy(() => import('@/pages/admin/AdminTablesPage'))
const AdminEmployeesPage = lazy(() => import('@/pages/admin/AdminEmployeesPage'))
const AdminClientsPage = lazy(() => import('@/pages/admin/AdminClientsPage'))
const AdminEventsPage = lazy(() => import('@/pages/admin/AdminEventsPage'))
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))

const RecepcionistaPage = lazy(() => import('@/pages/rececionista/RecepcionistaPage'))

// Operational

const OperacionalDashboardPage = lazy(() => import('@/pages/operacional/OperacionalDashboardPage'))
const OperacionalCozinhaPage = lazy(() => import('@/pages/operacional/OperacionalCozinhaPage'))
const OperacionalBarPage = lazy(() => import('@/pages/operacional/OperacionalBarPage'))
const OperacionalEquipaPage = lazy(() => import('@/pages/operacional/OperacionalEquipaPage'))
// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: wrap(HomePage) },
      { path: 'sobre', element: wrap(AboutPage) },
      { path: 'menu', element: wrap(MenuPage) },
      { path: 'galeria', element: wrap(GalleryPage) },
      { path: 'contactos', element: wrap(ContactsPage) },
      { path: 'login', element: wrap(LoginPage) },
      { path: 'registo', element: wrap(RegisterPage) },
      { path: 'eventos', element: wrap(EventsPage) },
      {
        path: '/rececionista',
        element: wrap(RecepcionistaPage),
      },
    ],
  },
  {
    path: '/cliente',
    element: <ClientLayout />,
    children: [
      { index: true, element: wrap(ClientDashboardPage) },
      { path: 'reservas', element: wrap(ClientReservationsPage) },
      { path: 'eventos', element: wrap(ClientEventsPage) },
      { path: 'perfil', element: wrap(ClientProfilePage) },
    ],
  },
  {
    path: '/scanner',
    element: wrap(ScannerPage),
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: wrap(AdminDashboardPage) },
      { path: 'reservas', element: wrap(AdminReservationsPage) },
      { path: 'mesas', element: wrap(AdminTablesPage) },
      { path: 'funcionarios', element: wrap(AdminEmployeesPage) },
      { path: 'clientes', element: wrap(AdminClientsPage) },
      { path: 'eventos', element: wrap(AdminEventsPage) },
      { path: 'cardapio', element: wrap(AdminMenuPage) },
      { path: 'imagens', element: wrap(AdminImagesPage) },
      { path: 'pagamentos', element: wrap(AdminPaymentsPage) },
      { path: 'relatorios', element: wrap(AdminReportsPage) },
    ],
  },

  {
    path: '/operacional',
    element: <OperacionalLayout />,
    children: [
      { index: true, element: wrap(OperacionalDashboardPage) },
      { path: 'cozinha', element: wrap(OperacionalCozinhaPage) },
      { path: 'bar', element: wrap(OperacionalBarPage) },
      { path: 'equipa', element: wrap(OperacionalEquipaPage) },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
