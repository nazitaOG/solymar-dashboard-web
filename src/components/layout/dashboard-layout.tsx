import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:ml-64 transition-all duration-300">

        {/* Header Sticky */}
        <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-3 border-b bg-background/80 backdrop-blur-md px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer h-9 w-9"
          >
            <Menu className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Logo Sol y Mar"
              className="h-8 md:h-9 w-auto object-contain block dark:hidden"
            />
            <img
              src="/logo-blanco.png"
              alt="Logo Sol y Mar"
              className="h-8 md:h-9 w-auto object-contain hidden dark:block"
            />
          </div>
        </header>

        {/* El contenido ahora fluye correctamente bajo el header sticky */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}