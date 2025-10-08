// src/router/index.tsx
import { createBrowserRouter, RouteObject, Navigate } from "react-router-dom";
import Login from "@/pages/AdminLogin";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

const routes: RouteObject[] = [
  { path: "/", element: <Navigate to="/login" replace /> }, 
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "*", element: <NotFound /> },
];

export const router = createBrowserRouter(routes);
