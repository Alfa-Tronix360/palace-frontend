import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type JSX } from 'react'
import { PublicLayout } from './PublicLayout'
import { ClientLayout } from './ClientLayout'
import { AdminLayout } from './AdminLayout'

// ─── Loader ──────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function wrap(Component: React.LazyExoticComponent<() => JSX.Element>) {
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

// ─── Páginas do cliente ───────────────────────────────────────────────────────
const ClientDashboardPage = lazy(() => import('@/pages/client/ClientDashboardPage'))
const ClientReservationsPage = lazy(() => import('@/pages/client/ClientReservationsPage'))
const ClientEventsPage = lazy(() => import('@/pages/client/ClientEventsPage'))
const ClientProfilePage = lazy(() => import('@/pages/client/ClientProfilePage'))

// ─── Páginas de admin ─────────────────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminReservationsPage = lazy(() => import('@/pages/admin/AdminReservationsPage'))
const AdminTablesPage = lazy(() => import('@/pages/admin/AdminTablesPage'))
const AdminClientsPage = lazy(() => import('@/pages/admin/AdminClientsPage'))
const AdminEventsPage = lazy(() => import('@/pages/admin/AdminEventsPage'))
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))

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
      { path: 'clientes', element: wrap(AdminClientsPage) },
      { path: 'eventos', element: wrap(AdminEventsPage) },
      { path: 'cardapio', element: wrap(AdminMenuPage) },
      { path: 'pagamentos', element: wrap(AdminPaymentsPage) },
      { path: 'relatorios', element: wrap(AdminReportsPage) },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
