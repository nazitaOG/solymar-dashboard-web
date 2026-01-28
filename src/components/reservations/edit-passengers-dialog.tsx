import { useState, useEffect} from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, UserPlus, Plus } from "lucide-react";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
// import { usePassengersStore } from "@/stores/usePassengerStore"; // 👈 YA NO LO NECESITAMOS PARA LEER

interface EditPassengersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPassengers: Pax[];
  // 👇 1. AGREGAMOS ESTO: Recibimos la lista desde el padre (que ya la tiene segura)
  availablePassengers: Pax[];
  onSave: (passengers: Pax[]) => void;
}

export function EditPassengersDialog({
  open,
  onOpenChange,
  currentPassengers,
  availablePassengers, // 👇 2. RECIBIMOS LA PROP
  onSave,
}: EditPassengersDialogProps) {
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>(currentPassengers);
  const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false);

  // 👇 3. BLINDAJE ANTI-CRASH (La solución al error filter is not a function)
  // Si por alguna razón llega null/undefined, usamos un array vacío.
  const safeAvailablePassengers = Array.isArray(availablePassengers)
    ? availablePassengers
    : [];

  useEffect(() => {
    if (open) {
      setSelectedPassengers(currentPassengers);
    }
  }, [open, currentPassengers]);

  const removePassenger = (id: string) => {
    setSelectedPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const addExistingPassenger = (passenger: Pax) => {
    setSelectedPassengers((prev) =>
      prev.find((p) => p.id === passenger.id) ? prev : [...prev, passenger]
    );
  };

  const handleSave = () => {
    onSave(selectedPassengers);
    onOpenChange(false);
  };

  const handleCreatePassenger = () => setIsPassengerDialogOpen(true);

  const handlePassengerCreated = (newPax: Pax) => {
    // Ya no dependemos del store aquí, simplemente lo agregamos a la selección local
    setSelectedPassengers((prev) => [...prev, newPax]);
    setIsPassengerDialogOpen(false);

    // Guardado automático opcional
    // setTimeout(() => {
    //   onSave([...selectedPassengers, newPax]);
    //   onOpenChange(false);
    // }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              Editar Pasajeros
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Pasajeros actuales */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">
                Pasajeros vinculados
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedPassengers.length === 0 ? (
                  <p className="text-[11px] md:text-xs text-muted-foreground">
                    No hay pasajeros vinculados
                  </p>
                ) : (
                  selectedPassengers.map((passenger) => (
                    <Badge
                      key={passenger.id}
                      variant="secondary"
                      className="flex items-center gap-2 py-1 px-2 text-[11px] md:text-xs"
                    >
                      <span>{passenger.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removePassenger(passenger.id);
                        }}
                        className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        aria-label={`Eliminar pasajero ${passenger.name}`}
                      >
                        <X className="h-3 w-3 cursor-pointer" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Buscar pasajero existente */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">
                Agregar pasajero existente
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer justify-start bg-transparent h-8 md:h-9 text-xs md:text-sm"
                  >
                    <UserPlus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    Buscar pasajero
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[280px] md:w-[400px] p-0 text-xs md:text-sm"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar por nombre..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron pasajeros</CommandEmpty>
                      <CommandGroup>
                        {/* 👇 USAMOS safeAvailablePassengers EN LUGAR DE availablePassengers */}
                        {safeAvailablePassengers
                          .filter((p) => !selectedPassengers.find((sp) => sp.id === p.id))
                          .slice(0, 50) // Limitamos a 50 para rendimiento
                          .map((passenger) => (
                            <CommandItem
                              key={passenger.id}
                              onSelect={() => addExistingPassenger(passenger)}
                              className="text-xs md:text-sm cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {passenger.name}
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  {passenger.nationality}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Crear nuevo pasajero */}
            <Button
              variant="outline"
              onClick={handleCreatePassenger}
              className="w-full cursor-pointer mt-2 h-8 md:h-9 text-xs md:text-sm"
            >
              <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              Crear nuevo pasajero
            </Button>
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPassengers(currentPassengers);
                onOpenChange(false);
              }}
              className="text-xs cursor-pointer md:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="text-xs cursor-pointer md:text-sm"
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PassengerDialog
        key="passenger-dialog"
        open={isPassengerDialogOpen}
        onOpenChange={setIsPassengerDialogOpen}
        // Fix de tipado rápido para cuando creamos uno nuevo
        passenger={undefined as unknown as Pax}
        mode="create"
        onSuccess={handlePassengerCreated}
      />
    </>
  );
}