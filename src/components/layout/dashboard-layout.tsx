import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button"; // Asegúrate de importar Button
import { Menu } from "lucide-react"; // Importamos el ícono de hamburguesa

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
        
        {/* --- NUEVO: Topbar / Header con el botón Burger --- */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden" // Solo visible en móvil/tablet (< 1024px)
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <div className="font-semibold">Solymar Travel</div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}