import { ReactNode, lazy, Suspense } from "react";
import { Navigate, RouteObject } from "react-router";
import { FullPageLoader } from "@/components/FullPageLoader";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { GuestRoute } from "@/router/GuestRoute";

interface AppRoute {
  path: string;
  element?: ReactNode;
  lazy?: RouteObject["lazy"];
  loader?: RouteObject["loader"];
  name?: string;
}

// Lazy load componentes
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const Reservas = lazy(() => import("@/pages/reservas/List"));
const ReservaDetail = lazy(() => import("@/pages/reservas/Detail"));
const Pasajeros = lazy(() => import("@/pages/pasajeros/List"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Wrapper para Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<FullPageLoader />}>
    <Component />
  </Suspense>
);

// Loader opcional para precargar chunk
const reservasLoader = async () => {
  await import("@/pages/reservas/Detail");
  return null;
};

export const routes: AppRoute[] = [
  // RUTAS PROTEGIDAS
  {
    path: "/reservas",
    name: "Reservas",
    element: (
      <ProtectedRoute>
        {withSuspense(Reservas)}
      </ProtectedRoute>
    ),
    loader: reservasLoader,
  },
  {
    path: "/reservas/:id",
    name: "ReservaDetail",
    element: (
      <ProtectedRoute>
        {withSuspense(ReservaDetail)}
      </ProtectedRoute>
    ),
  },
  {
    path: "/pasajeros",
    name: "Pasajeros",
    element: (
      <ProtectedRoute>
        {withSuspense(Pasajeros)}
      </ProtectedRoute>
    ),
  },
  // Rutas públicas
  {
    path: "*",
    name: "NotFound",
    element: withSuspense(NotFound),
  },
  {
    path: "/",
    element: (
      <GuestRoute>
        <Navigate to="/login" replace />
      </GuestRoute>
    ),
  },
  {
    path: "/login",
    name: "Login",
    element: (
      <GuestRoute>
        {withSuspense(AdminLogin)}
      </GuestRoute>
    ),
  },
];