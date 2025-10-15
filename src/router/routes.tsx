import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import AdminLogin from "@/pages/AdminLogin";
import Reservas from "@/pages/reservas/List";
import ReservaDetail from "@/pages/reservas/Detail";
import Pasajeros from "@/pages/pasajeros/List";
import NotFound from "@/pages/NotFound";

interface AppRoute {
  path: string;
  element: ReactNode;
  name?: string;
}

export const routes: AppRoute[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <AdminLogin />,
    name: 'Login',
  },
  {
    path: '/reservas',
    element: <Reservas />,
    name: 'Reservas',
  },
  {
    path: '/reservas/:id',
    element: <ReservaDetail />,
  },
  {
    path: '/pasajeros',
    element: <Pasajeros />,
    name: 'Pasajeros',
  },
  {
    path: '*',
    element: <NotFound />,
  }
];
