import { createBrowserRouter, RouteObject } from "react-router"; // O react-router-dom
import { Outlet } from "react-router"; // 👈 Necesitas importar Outlet
import { routes } from "./routes";
import { FullPageLoader } from "@/components/FullPageLoader"; // 👈 Importa tu loader

export const router = createBrowserRouter([
  {
    path: "/",
    // El Outlet es un "hueco" donde se renderizan tus rutas hijas (routes)
    element: <Outlet />, 
    // LA SOLUCIÓN AL WARNING
    hydrateFallbackElement: <FullPageLoader />, 
    // Tus rutas originales pasan a ser hijas de esta ruta raíz
    children: routes,
  }
] satisfies RouteObject[]);