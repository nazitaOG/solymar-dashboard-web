import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, Users, BarChart3, Settings, Plane, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/router/routes";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

// Mapeo de rutas a iconos
const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/reservas": Calendar,
  "/pasajeros": Users,
  "/reportes": BarChart3,
  "/ajustes": Settings,
};

// Filtrar y mapear las rutas que necesitamos
const navigation: NavItem[] = routes
  .filter(route => route.name && ["Reservas", "Pasajeros"].includes(route.name))
  .map(route => ({
    name: route.name!,
    href: route.path,
    icon: routeIcons[route.path] || Calendar,
    active: true,
  }))
  .concat([
    { name: "Reportes", href: "/reportes", icon: BarChart3, active: false },
    { name: "Ajustes", href: "/ajustes", icon: Settings, active: false },
  ]);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-6">
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Solymar Travel</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const starts = pathname.startsWith(item.href);

              if (!item.active) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium cursor-not-allowed text-muted-foreground/50"
                    aria-disabled
                    title="Próximamente"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    <span className="ml-auto text-xs">(Próximamente)</span>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      (isActive || starts)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground">Dashboard v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
