import { ReactNode } from "react";
import { Navigate, RouteObject } from "react-router";

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
      const { default: AdminLogin } = await import(/* webpackChunkName: "AdminLogin" */ '@/pages/AdminLogin');
      // React Router espera un objeto con una propiedad 'Component'
      return { Component: AdminLogin };
    },
  },
  {
    path: '/reservas',
    name: 'Reservas',
    lazy: async () => {
      // Esta línea le dice al navegador: "Empezá a descargar esto
      // en segundo plano. No me esperes."
      // Esto es lo que logra tu "nested lazy loading".
      import(
        /* webpackChunkName: "reservas-detail" */
        '@/pages/reservas/Detail'
      );
      // Esta línea SÍ usa 'await', porque React Router
      // necesita esperar a que este componente cargue para
      // poder mostrar la página de la lista.
      const { default: Reservas } = await import(/* webpackChunkName: "Reservas" */ '@/pages/reservas/List');
      return { Component: Reservas };
    },
  },
  {
    path: '/reservas/:id',
    lazy: async () => {
      const { default: ReservaDetail } = await import(/* webpackChunkName: "ReservaDetail" */ '@/pages/reservas/Detail');
      return { Component: ReservaDetail };
    },

  },
  {
    path: '/pasajeros',
    name: 'Pasajeros',
    lazy: async () => {
      const { default: Pasajeros } = await import(/* webpackChunkName: "Pasajeros" */ '@/pages/pasajeros/List');
      return { Component: Pasajeros };
    },
  },
  {
    path: '*',
    name: 'NotFound',
    lazy: async () => {
      const { default: NotFound } = await import(/* webpackChunkName: "NotFound" */ '@/pages/NotFound');
      return { Component: NotFound };
    },
  },
];
