import { useState, useEffect } from "react";
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
import { usePassengersStore } from "@/stores/usePassengerStore"; // ✅ Zustand store

interface EditPassengersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPassengers: Pax[];
  onSave: (passengers: Pax[]) => void;
}

export function EditPassengersDialog({
  open,
  onOpenChange,
  currentPassengers,
  onSave,
}: EditPassengersDialogProps) {
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>(currentPassengers);
  const [isPassengerDialogOpen, setIsPassengerDialogOpen] = useState(false);

  // ✅ Zustand global store
  const { passengers: availablePassengers, addPassenger } = usePassengersStore();

  // 🧠 🔄 Cuando el diálogo se abre, restablecemos el estado local
  useEffect(() => {
    if (open) {
      setSelectedPassengers(currentPassengers);
    }
  }, [open, currentPassengers]);

  // 🧩 Eliminar pasajero (con la X)
  const removePassenger = (id: string) => {
    setSelectedPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  // ➕ Agregar pasajero existente
  const addExistingPassenger = (passenger: Pax) => {
    setSelectedPassengers((prev) =>
      prev.find((p) => p.id === passenger.id) ? prev : [...prev, passenger]
    );
  };

  // 💾 Guardar selección
  const handleSave = () => {
    onSave(selectedPassengers);
    onOpenChange(false);
  };

  // 🧠 Crear nuevo pasajero
  const handleCreatePassenger = () => setIsPassengerDialogOpen(true);

  // 🧩 Callback al crear pasajero desde PassengerDialog real
  const handlePassengerCreated = (newPax: Pax) => {
    addPassenger(newPax); // 🔹 1) Actualiza el store global
    setSelectedPassengers((prev) => [...prev, newPax]); // 🔹 2) Agrega localmente
    setIsPassengerDialogOpen(false); // 🔹 3) Cierra el sub-diálogo

    // 🔹 4) Auto-guardar y cerrar el diálogo principal
    setTimeout(() => {
      onSave([...selectedPassengers, newPax]);
      onOpenChange(false);
    }, 100);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm">
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
                        <X className="h-3 w-3" />
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
                    className="w-full justify-start bg-transparent h-8 md:h-9 text-xs md:text-sm"
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
                        {availablePassengers
                          .filter((p) => !selectedPassengers.find((sp) => sp.id === p.id))
                          .map((passenger) => (
                            <CommandItem
                              key={passenger.id}
                              onSelect={() => addExistingPassenger(passenger)}
                              className="text-xs md:text-sm"
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
              className="w-full mt-2 h-8 md:h-9 text-xs md:text-sm"
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
              className="text-xs md:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="text-xs md:text-sm"
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✈️ PassengerDialog real */}
      <PassengerDialog
        key="passenger-dialog"
        open={isPassengerDialogOpen}
        onOpenChange={setIsPassengerDialogOpen}
        passenger={undefined as unknown as Pax}
        mode="create"
        onSave={handlePassengerCreated}
      />
    </>
  );
}
