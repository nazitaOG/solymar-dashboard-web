import { useState, useEffect } from "react";
import { Search, Plus, Moon, Sun, Calendar as CalendarIcon, Menu } from "lucide-react";
import { useTheme } from "../theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

type TopbarProps = {
  onCreateReservation?: () => void;
  onMenuClick?: () => void;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export default function Topbar({ onCreateReservation, onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 md:gap-4 border-b border-border bg-card px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Búsqueda global */}
      <div className="relative hidden sm:flex flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder="Buscar reservas, pasajeros..." className="pl-9" />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Selector de rango de fechas */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[140px] sm:min-w-[240px] justify-start text-left font-normal bg-transparent"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                    {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                  </>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: es })
                )
              ) : (
                "Seleccionar rango"
              )}
            </span>
            <span className="sm:hidden">Fechas</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={isMobile ? 1 : 2}
            locale={es}
          />
        </PopoverContent>
      </Popover>

      {/* Crear reserva */}
      <Button onClick={onCreateReservation} className="gap-2">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Crear Reserva</span>
      </Button>

      {/* Tema claro/oscuro */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Cambiar tema"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </header>
  );
}
