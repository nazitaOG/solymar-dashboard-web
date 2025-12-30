import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. El Sidebar debe tener un z-index alto (ej. z-[60]) 
          para que tape el contenido y el fondo del header.
      */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:ml-64 transition-all duration-300">
        
        {/* --- Topbar / Header --- 
            Bajamos su z-index a 40 para que el Sidebar pase por encima,
            pero el botón tendrá un z-index superior para quedar siempre arriba.
        */}
        <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-3 md:gap-4 border-b bg-background px-4 md:px-6 lg:hidden">
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            /* z-[70]: Este botón debe ser superior al Sidebar (z-[60]) 
               para que la "X" se vea y funcione cuando el menú esté abierto.
            */
            className="cursor-pointer lg:hidden h-8 w-8 md:h-9 md:w-9 relative z-[70]" 
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 md:h-6 md:w-6 transition-all text-foreground" />
            ) : (
              <Menu className="h-5 w-5 md:h-6 md:w-6 transition-all" />
            )}
          </Button>
          
          {/* Logo en el header (solo móvil) */}
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
        </header>

        {/* Contenido Principal: 
            Aseguramos que el main ocupe el alto restante y tenga scroll.
        */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}