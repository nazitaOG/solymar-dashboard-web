import { createBrowserRouter, RouteObject, Navigate } from "react-router-dom";
import AdminLogin from "@/pages/AdminLogin";
import Dashboard from "@/pages/Dashboard";
import Reservas from "@/pages/reservas/List";
import ReservaDetail from "@/pages/reservas/Detail";
import Pasajeros from "@/pages/pasajeros/List";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <AdminLogin /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/reservas", element: <Reservas /> },
  { path: "/reservas/:id", element: <ReservaDetail /> },
  { path: "/pasajeros", element: <Pasajeros /> },
  { path: "*", element: <NotFound /> },
] satisfies RouteObject[]);
