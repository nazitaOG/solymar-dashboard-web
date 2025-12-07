import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils/class_value.utils";
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";
import type { DateRange } from "react-day-picker";

import type { ReservationFilters } from "@/lib/interfaces/reservation/reservation.interface";
import type { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

interface ReservationFiltersProps {
  passengers: Pax[];
  onFilterChange: (filters: ReservationFilters) => void;
}

const stateOptions = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "CANCELLED", label: "Cancelada" },
];

export function ReservationFiltersComponent({
  passengers,
  onFilterChange,
}: ReservationFiltersProps) {
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<ReservationState[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currency, setCurrency] = useState<Currency | undefined>();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [openPassengers, setOpenPassengers] = useState(false);
  const [openStates, setOpenStates] = useState(false);

  const handleApplyFilters = () => {
    const passengerNames = selectedPassengers
      .map((id) => passengers.find((p) => p.id === id)?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);

    onFilterChange({
      passengerNames,
      sortBy,
      states: selectedStates.length > 0 ? selectedStates : undefined,
      currency,
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
    });
  };

  const handleClearFilters = () => {
    setSelectedPassengers([]);
    setSelectedStates([]);
    setSortBy("newest");
    setCurrency(undefined);
    setDateRange(undefined);
    onFilterChange({ sortBy: "newest" });
  };

  const togglePassenger = (passengerId: string) => {
    setSelectedPassengers((prev) =>
      prev.includes(passengerId)
        ? prev.filter((id) => id !== passengerId)
        : [...prev, passengerId]
    );
  };

  const toggleState = (state: ReservationState) => {
    setSelectedStates((prev) =>
      prev.includes(state)
        ? prev.filter((s) => s !== state)
        : [...prev, state]
    );
  };

  return (
    <div className="space-y-4 w-full rounded-lg border border-border bg-card p-3 md:p-4">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm md:text-base">Filtros</h3>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* 1. Date Range Filter */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Rango de fechas</Label>
          {/* Se agregó [&>button]:cursor-pointer para asegurar la mano en el input de fecha */}
          <div className="[&>button]:h-8 [&>button]:text-xs md:[&>button]:h-10 md:[&>button]:text-sm [&>button]:w-full [&>button]:bg-transparent [&>button]:font-normal [&>button]:cursor-pointer">
            <DateTimePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              withRange={true}
              label="Seleccionar fechas"
              includeTime={false}
            />
          </div>
        </div>

        {/* 2. Passenger Filter (Multi-select) */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Buscar por pasajero</Label>
          <Popover open={openPassengers} onOpenChange={setOpenPassengers}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-transparent h-8 md:h-10 text-xs md:text-sm px-3 font-normal cursor-pointer"
              >
                <span className="truncate">
                  {selectedPassengers.length > 0
                    ? `${selectedPassengers.length} seleccionados`
                    : "Seleccionar pasajeros"}
                </span>
                <Filter className="ml-2 h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar pasajero..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No se encontraron pasajeros</CommandEmpty>
                  <CommandGroup>
                    {passengers.map((passenger) => (
                      <CommandItem
                        key={passenger.id}
                        onSelect={() => togglePassenger(passenger.id)}
                        className="text-xs md:text-sm cursor-pointer" // cursor-pointer aquí
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 md:h-4 md:w-4",
                            selectedPassengers.includes(passenger.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {passenger.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Badges para Pasajeros */}
          {selectedPassengers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {selectedPassengers.map((id) => {
                const passenger = passengers.find((p) => p.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1 text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6">
                    {passenger?.name}
                    <button
                      type="button"
                      className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer" // cursor-pointer aquí
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePassenger(id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Sort By */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Ordenar por fecha</Label>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "newest" | "oldest")}
          >
            <SelectTrigger className="bg-transparent w-full h-8 md:h-10 text-xs md:text-sm cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* cursor-pointer en las opciones */}
              <SelectItem value="newest" className="text-xs md:text-sm cursor-pointer">Más nuevas primero</SelectItem>
              <SelectItem value="oldest" className="text-xs md:text-sm cursor-pointer">Más antiguas primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. State Filter */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Estado</Label>
          <Popover open={openStates} onOpenChange={setOpenStates}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-transparent h-8 md:h-10 text-xs md:text-sm px-3 font-normal cursor-pointer"
              >
                <span className="truncate">
                  {selectedStates.length > 0
                    ? `${selectedStates.length} seleccionados`
                    : "Todos los estados"}
                </span>
                <Filter className="ml-2 h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {stateOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleState(option.value as ReservationState)}
                        className="text-xs md:text-sm cursor-pointer" // cursor-pointer aquí
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 md:h-4 md:w-4",
                            selectedStates.includes(option.value as ReservationState)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

           {/* Badges para Estado */}
           {selectedStates.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {selectedStates.map((st) => {
                const option = stateOptions.find((o) => o.value === st);
                return (
                  <Badge key={st} variant="secondary" className="gap-1 text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6">
                    {option?.label}
                    <button
                      type="button"
                      className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer" // cursor-pointer aquí
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleState(st);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Botones de Acción */}
      <div className="flex gap-2">
        <Button 
          onClick={handleApplyFilters} 
          size="sm" 
          className="h-8 md:h-9 text-xs md:text-sm cursor-pointer"
        >
          Aplicar filtros
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="h-8 md:h-9 text-xs md:text-sm cursor-pointer"
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}

export { ReservationFiltersComponent as ReservationFilters };