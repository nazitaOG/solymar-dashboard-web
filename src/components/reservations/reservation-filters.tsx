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
    });
  };

  const handleClearFilters = () => {
    setSelectedPassengers([]);
    setSelectedStates([]);
    setSortBy("newest");
    setCurrency(undefined);
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
    <div className="space-y-4 rounded-lg w-fit border border-border bg-card p-3 md:p-4">
      {/* 🔹 Header */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm md:text-base">Filtros</h3>
      </div>

      {/* 🔹 Contenedor de filtros principales */}
      <div className="flex flex-wrap justify-start gap-6">
        {/* Passenger Filter */}
        <div className="flex flex-col gap-2 w-[260px]">
          <Label className="text-sm">Buscar por pasajero</Label>
          <Popover open={openPassengers} onOpenChange={setOpenPassengers}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-sm"
              >
                {selectedPassengers.length > 0
                  ? `${selectedPassengers.length} seleccionados`
                  : "Seleccionar pasajeros"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar pasajero..." />
                <CommandList>
                  <CommandEmpty>No se encontraron pasajeros</CommandEmpty>
                  <CommandGroup>
                    {passengers.map((passenger) => (
                      <CommandItem
                        key={passenger.id}
                        onSelect={() => togglePassenger(passenger.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
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

          {selectedPassengers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedPassengers.map((id) => {
                const passenger = passengers.find((p) => p.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1 text-xs">
                    {passenger?.name}
                    <button
                      type="button"
                      className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedPassengers((prev) => prev.filter((pid) => pid !== id));
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

        {/* Sort By */}
        <div className="flex flex-col gap-2 w-[220px]">
          <Label className="text-sm">Ordenar por fecha</Label>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "newest" | "oldest")}
          >
            <SelectTrigger className="bg-transparent text-sm w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más nuevas primero</SelectItem>
              <SelectItem value="oldest">Más antiguas primero</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State Filter */}
        <div className="flex flex-col gap-2 w-[220px]">
          <Label className="text-sm">Estado</Label>
          <Popover open={openStates} onOpenChange={setOpenStates}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent text-sm"
              >
                {selectedStates.length > 0
                  ? `${selectedStates.length} seleccionados`
                  : "Todos los estados"}
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
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
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

          {selectedStates.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedStates.map((st) => {
                const option = stateOptions.find((o) => o.value === st);
                return (
                  <Badge key={st} variant="secondary" className="gap-1 text-xs">
                    {option?.label}
                    <button
                      type="button"
                      className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedStates((prev) => prev.filter((s) => s !== st));
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

      {/* 🔹 Botones abajo a la izquierda */}
      <div className="flex gap-2 justify-start pt-4">
        <Button onClick={handleApplyFilters} size="sm">
          Aplicar filtros
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="bg-transparent"
        >
          Limpiar
        </Button>
      </div>

    </div>
  );
}

export { ReservationFiltersComponent as ReservationFilters };
