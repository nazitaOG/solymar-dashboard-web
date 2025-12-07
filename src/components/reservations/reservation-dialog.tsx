import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Plus, UserPlus } from "lucide-react"

import { PassengerDialog } from "@/components/passengers/passenger-dialog"
import type { Pax } from "@/lib/interfaces/pax/pax.interface"
import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface"
import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface"

interface ReservationDialogProps {
  open: boolean
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
  availablePassengers: Pax[]
  onConfirm: (data: { id?: string; state: ReservationState; passengers: Pax[] }) => void
  reservation?: Reservation | null
  onPassengerCreated?: (newPassenger: Pax) => void
}

export function ReservationDialog({
  open,
  mode,
  onOpenChange,
  availablePassengers,
  onConfirm,
  reservation,
  onPassengerCreated,
}: ReservationDialogProps) {
  const isEdit = mode === "edit"

  // Estado principal
  const [state, setState] = useState<ReservationState>(ReservationState.PENDING)
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>([])

  // 🔹 Lista de pasajeros locales (reactiva para el buscador)
  const [passengers, setPassengers] = useState<Pax[]>(availablePassengers)

  // 🔹 Estado para PassengerDialog
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false)

  // 🔄 Mantiene sincronizada la lista local con el padre
  useEffect(() => {
    setPassengers(availablePassengers)
  }, [availablePassengers])


  // --------------------------------------------------
  // 🧭 Prellenar en modo edición
  useEffect(() => {
    if (isEdit && reservation) {
      setState(reservation.state)

      const normalized = reservation.paxReservations.map((paxRes) => {
        const pax = paxRes.pax as Partial<Pax>
        return {
          id: pax.id ?? "",
          name: pax.name ?? "",
          birthDate: pax.birthDate ?? "",
          nationality: pax.nationality ?? "",
          passport: pax.passport,
          dni: pax.dni,
        } satisfies Pax
      })
      setSelectedPassengers(normalized)
    } else if (!isEdit) {
      setState(ReservationState.PENDING)
      setSelectedPassengers([])
    }
  }, [isEdit, reservation])

  // --------------------------------------------------
  // Funciones auxiliares
  const removePassenger = (id: string) => {
    setSelectedPassengers((prev) => prev.filter((p) => p.id !== id))
  }

  const addPassenger = (passenger: Pax) => {
    if (!selectedPassengers.find((p) => p.id === passenger.id)) {
      setSelectedPassengers((prev) => [...prev, passenger])
    }
  }

  const handleConfirm = () => {
    onConfirm({
      id: reservation?.id,
      state,
      passengers: selectedPassengers,
    })
    onOpenChange(false)
  }

  return (
    <>
      {/* 🌍 Diálogo principal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* 👇 [&>button]:cursor-pointer para la X de cerrar */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isEdit ? "Editar Reserva" : "Crear Nueva Reserva"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Estado */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Estado</Label>
              <Select
                value={state}
                onValueChange={(v) => setState(v as ReservationState)}
              >
                {/* 👇 cursor-pointer en trigger */}
                <SelectTrigger className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs md:text-sm">
                  {/* 👇 cursor-pointer en items */}
                  <SelectItem value="PENDING" className="cursor-pointer">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED" className="cursor-pointer">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED" className="cursor-pointer">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pasajeros vinculados */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Pasajeros vinculados</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] rounded-lg border border-border bg-muted/50 p-3">
                {selectedPassengers.length === 0 ? (
                  <p className="text-[11px] md:text-xs text-muted-foreground">
                    No hay pasajeros vinculados
                  </p>
                ) : (
                  selectedPassengers.map((passenger) => (
                    <div
                      key={passenger.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground text-[11px] md:text-xs border border-border"
                    >
                      <span>{passenger.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removePassenger(passenger.id)
                        }}
                        // 👇 cursor-pointer en botón X de borrar pax
                        className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                        aria-label={`Eliminar pasajero ${passenger.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Buscar pasajero existente */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Agregar pasajero existente</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    // 👇 cursor-pointer
                    className="w-full justify-start bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer"
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
                        {passengers
                          .filter((p) => !selectedPassengers.find((sp) => sp.id === p.id))
                          .map((passenger) => (
                            <CommandItem
                              key={passenger.id}
                              onSelect={() => addPassenger(passenger)}
                              // 👇 cursor-pointer
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
              onClick={() => setPassengerDialogOpen(true)}
              // 👇 cursor-pointer
              className="w-full h-8 md:h-9 text-xs md:text-sm cursor-pointer"
            >
              <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              Crear nuevo pasajero
            </Button>

            {/* Info */}
            {!isEdit && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 md:p-4">
                <p className="text-[11px] md:text-xs text-muted-foreground">
                  Después de crear la reserva, podrás agregar hoteles, vuelos, cruceros
                  y otros servicios desde la página de detalle.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              // 👇 cursor-pointer
              className="text-xs md:text-sm cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isEdit && selectedPassengers.length === 0}
              // 👇 cursor-pointer
              className="text-xs md:text-sm cursor-pointer"
            >
              {isEdit ? "Guardar Cambios" : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✨ Diálogo de creación de pasajero reutilizable */}
      <PassengerDialog
        open={passengerDialogOpen}
        onOpenChange={setPassengerDialogOpen}
        mode="create"
        onSave={(createdPax) => {
          addPassenger(createdPax)
          setPassengers((prev) => [...prev, createdPax])
          onPassengerCreated?.(createdPax) // 🔥 notifica al padre
          setPassengerDialogOpen(false)
        }}
      />
    </>
  )
}