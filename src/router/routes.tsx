import { ReactNode } from "react";
import { Navigate, RouteObject } from "react-router-dom";

interface AppRoute {
  path: string;
  element?: ReactNode;
  lazy?: RouteObject['lazy']; // La propiedad 'lazy' de RouteObject
  name?: string;
}

export const routes: AppRoute[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    name: 'Login',
    lazy: async () => {
      // Usamos import() dinámico
      const { default: AdminLogin } = await import('@/pages/AdminLogin');
      // React Router espera un objeto con una propiedad 'Component'
      return { Component: AdminLogin };
    },
  },
  {
    path: '/reservas',
    name: 'Reservas',
    lazy: async () => {
      const { default: Reservas } = await import('@/pages/reservas/List');
      return { Component: Reservas };
    },
  },
  {
    path: '/reservas/:id',
    lazy: async () => {
      const { default: ReservaDetail } = await import('@/pages/reservas/Detail');
      return { Component: ReservaDetail };
    },

  },
  {
    path: '/pasajeros',
    name: 'Pasajeros',
    lazy: async () => {
      const { default: Pasajeros } = await import('@/pages/pasajeros/List');
      return { Component: Pasajeros };
    },
  },
  {
    path: '*',
    name: 'NotFound',
    lazy: async () => {
      const { default: NotFound } = await import('@/pages/NotFound');
      return { Component: NotFound };
    },
  },
];
