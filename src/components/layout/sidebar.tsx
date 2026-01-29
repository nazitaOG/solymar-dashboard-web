import { NavLink, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils/class_value.utils";
import {
  Calendar,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/router/routes";
import { useTheme } from "@/components/theme-context";
import { useAuthStore } from "@/stores/useAuthStore";

// 👇 1. IMPORTAMOS LAS HERRAMIENTAS DE IDIOMA
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "@/components/utils/language-toggle";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

const routeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/reservas": Calendar,
  "/pasajeros": Users,
  "/reportes": BarChart3,
  "/ajustes": Settings,
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);

  // 👇 2. USAMOS EL HOOK DE TRADUCCIÓN
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 👇 3. CONSTRUIMOS LA NAVEGACIÓN DENTRO DEL COMPONENTE
  // Esto permite que los nombres se traduzcan en tiempo real
  const navigation: NavItem[] = [
    // Mapeamos las rutas dinámicas (Reservas, Pasajeros)
    ...routes
      .filter(route => route.name && ["Reservas", "Pasajeros"].includes(route.name))
      .map(route => {
        // Traducción condicional según la ruta
        let translatedName = route.name!;
        if (route.path === "/reservas") translatedName = t("reservations.title");
        if (route.path === "/pasajeros") translatedName = t("passengers.title");

        return {
          name: translatedName,
          href: route.path,
          icon: routeIcons[route.path] || Calendar,
          active: true,
        };
      }),
    // Agregamos los ítems estáticos (Reportes, Ajustes)
    { 
      name: t("common.reports", "Reportes"), // (Asegúrate de agregar 'reports' a common en tu JSON si quieres)
      href: "/reportes", 
      icon: BarChart3, 
      active: false 
    },
    { 
      name: t("common.settings", "Ajustes"), // (Igual para 'settings')
      href: "/ajustes", 
      icon: Settings, 
      active: false 
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[50] bg-background/80 backdrop-blur-sm lg:hidden cursor-pointer"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-[60] h-full w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">

          {/* Header del Sidebar */}
          <div className="flex h-16 md:h-20 items-center justify-between lg:justify-start gap-2 border-b border-border px-5 shrink-0">
            {/* Logo Desktop */}
            <div className="hidden lg:flex items-center justify-center w-full">
              <img
                src="/logo.png"
                alt="Sol y Mar"
                className="h-12 w-auto object-contain block dark:hidden"
              />
              <img
                src="/logo-blanco.png"
                alt="Sol y Mar"
                className="h-12 w-auto object-contain hidden dark:block"
              />
            </div>

            {/* Cabecera Móvil Pro */}
            <div className="flex lg:hidden w-full items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                {t('common.menu') || "Menú Principal"}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full border-border bg-background/50 backdrop-blur-md shadow-sm hover:bg-accent transition-all active:scale-95 group cursor-pointer"
              >
                <X className="h-5 w-5 text-muted-foreground group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const starts = pathname.startsWith(item.href);

              if (!item.active) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium cursor-not-allowed text-muted-foreground/40"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    <span className="ml-auto text-[10px] opacity-50">(Próx.)</span>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      (isActive || starts)
                        ? "bg-primary text-primary-foreground shadow-sm"
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

          {/* Footer del Sidebar */}
          <div className="shrink-0 border-t border-border p-4 bg-card/50 backdrop-blur-lg">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-primary tracking-tighter uppercase leading-none">Solymar Viajes</p>
                <p className="text-[9px] text-muted-foreground mt-1">Dashboard v1.0</p>
              </div>
              
              <div className="flex items-center gap-1">
                {/* 👇 4. AQUÍ ESTÁ EL BOTÓN DE IDIOMA A LA IZQUIERDA DE SOL/LUNA */}
                <LanguageToggle />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full cursor-pointer"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-[env(safe-area-inset-bottom)] lg:hidden" />
          </div>
        </div>
      </aside>
    </>
  );
}