import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AdminLogin from '@/pages/AdminLogin'
import './globals.css'

const router = createBrowserRouter([
  { path: '/', element: <AdminLogin /> },       // o tu landing
  { path: '/register', element: <AdminLogin /> } // donde quieras
])

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)
