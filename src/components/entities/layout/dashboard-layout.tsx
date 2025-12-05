import { useState } from "react";
import Sidebar from "@/components/entities/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar: Se encarga de mostrarse u ocultarse según isOpen y el tamaño de pantalla */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:ml-64 transition-all duration-300">
        
        {/* --- Topbar / Header --- */}
        {/* Ajuste de altura: h-14 en móvil (56px) / h-16 en desktop (64px) */}
        {/* Ajuste de padding: px-4 en móvil / px-6 en desktop */}
        <header className="flex h-14 md:h-16 items-center gap-3 md:gap-4 border-b bg-background px-4 md:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            // Botón más compacto en móvil (h-8 w-8)
            className="lg:hidden h-8 w-8 md:h-9 md:w-9" 
          >
            {/* Ícono ajustado: 20px en móvil, 24px en desktop */}
            <Menu className="h-5 w-5 md:h-6 md:w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          
          {/* Título ajustado: text-sm en móvil / text-lg en desktop */}
          <div className="font-semibold text-sm md:text-lg">Solymar Travel</div>
        </header>

        {/* Contenido Principal */}
        {/* Ajuste de padding: p-3 en móvil (apretado) / p-6 en desktop (aireado) */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}