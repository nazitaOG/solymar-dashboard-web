import { ReactNode, lazy, Suspense } from "react";
import { Navigate, RouteObject } from "react-router";
import { FullPageLoader } from "@/components/FullPageLoader";

interface AppRoute {
  path: string;
  element?: ReactNode;
  lazy?: RouteObject["lazy"];
  loader?: RouteObject["loader"];
  name?: string;
}

// Lazy load componentes
const AdminLogin = lazy(
  () => import(/* webpackChunkName: "AdminLogin" */ "@/pages/AdminLogin")
);
const Reservas = lazy(
  () => import(/* webpackChunkName: "Reservas" */ "@/pages/reservas/List")
);
const ReservaDetail = lazy(
  () => import(/* webpackChunkName: "ReservaDetail" */ "@/pages/reservas/Detail")
);
const Pasajeros = lazy(
  () => import(/* webpackChunkName: "Pasajeros" */ "@/pages/pasajeros/List")
);
const NotFound = lazy(
  () => import(/* webpackChunkName: "NotFound" */ "@/pages/NotFound")
);

// Wrapper para Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<FullPageLoader />}>
    <Component />
  </Suspense>
);

// Loader que precarga el chunk de ReservaDetail
const reservasLoader = async () => {
  // Precarga el chunk sin esperar
  await import(/* webpackChunkName: "ReservaDetail" */ "@/pages/reservas/Detail");
  return null;
};

export const routes: AppRoute[] = [
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    name: "Login",
    element: withSuspense(AdminLogin),
  },
  {
    path: "/reservas",
    name: "Reservas",
    element: withSuspense(Reservas),
    loader: reservasLoader,
  },
  {
    path: "/reservas/:id",
    name: "ReservaDetail",
    element: withSuspense(ReservaDetail),
  },
  {
    path: "/pasajeros",
    name: "Pasajeros",
    element: withSuspense(Pasajeros),
  },
  {
    path: "*",
    name: "NotFound",
    element: withSuspense(NotFound),
  },
];