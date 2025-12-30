import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react"; // Importamos X

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar recibe el estado */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:ml-64 transition-all duration-300">
        
        {/* --- Topbar / Header --- */}
        <header className="sticky top-0 z-50 flex h-14 md:h-16 items-center gap-3 md:gap-4 border-b bg-background px-4 md:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            // CAMBIO: Ahora hace toggle (!sidebarOpen)
            onClick={() => setSidebarOpen(!sidebarOpen)}
            // CAMBIO: z-50 para que quede por encima del Sidebar abierto
            className="cursor-pointer lg:hidden h-8 w-8 md:h-9 md:w-9 relative z-50" 
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {/* CONDICIONAL: Si está abierto muestra X, si no Menu */}
            {sidebarOpen ? (
              <X className="h-5 w-5 md:h-6 md:w-6 transition-all" />
            ) : (
              <Menu className="h-5 w-5 md:h-6 md:w-6 transition-all" />
            )}
          </Button>
          
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}