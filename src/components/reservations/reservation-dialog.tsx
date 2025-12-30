import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  
  // 🔑 Key para forzar el remonte del PassengerDialog y limpiar su estado interno
  const [paxDialogKey, setPaxDialogKey] = useState(0)

  // Estado del formulario
  const [state, setState] = useState<ReservationState>(ReservationState.PENDING)
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>([])

  // Lista de pasajeros locales (para el buscador)
  const [passengers, setPassengers] = useState<Pax[]>(availablePassengers)

  // Estado de modales hijos
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // 🔄 Mantiene sincronizada la lista local cuando cambian los pasajeros externos
  useEffect(() => {
    setPassengers(availablePassengers)
  }, [availablePassengers])

  // 🧭 Cargar/Resetear datos al abrir o cambiar de modo
  useEffect(() => {
    if (open) {
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
      } else {
        setState(ReservationState.PENDING)
        setSelectedPassengers([])
      }
    }
  }, [open, isEdit, reservation])

  // 🔎 Dirty Check (Comparar si hubo cambios respecto al estado inicial)
  const isDirty = useMemo(() => {
    if (!open) return false

    const initialData =
      isEdit && reservation
        ? {
          state: reservation.state,
          passengerIds: reservation.paxReservations
            .map((pr) => pr.pax.id)
            .sort()
            .join(","),
        }
        : {
          state: ReservationState.PENDING,
          passengerIds: "",
        }

    const currentData = {
      state,
      passengerIds: selectedPassengers
        .map((p) => p.id)
        .sort()
        .join(","),
    }

    return JSON.stringify(initialData) !== JSON.stringify(currentData)
  }, [state, selectedPassengers, isEdit, reservation, open])

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
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          // Bloqueo de cierre si hay cambios sin guardar
          if (!isOpen && isDirty) {
            setShowDiscardConfirm(true)
          } else {
            onOpenChange(isOpen)
          }
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer"
          onInteractOutside={(e) => {
            // 🛡️ FIX CRÍTICO: Si el diálogo de pasajeros está abierto, 
            // ignoramos cualquier interacción fuera de este diálogo padre.
            if (passengerDialogOpen) {
              e.preventDefault();
              return;
            }

            if (isDirty) {
              e.preventDefault()
              setShowDiscardConfirm(true)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isEdit ? "Editar Reserva" : "Crear Nueva Reserva"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selector de Estado */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Estado</Label>
              <Select
                value={state}
                onValueChange={(v) => setState(v as ReservationState)}
              >
                <SelectTrigger className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs md:text-sm">
                  <SelectItem value="PENDING" className="cursor-pointer">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED" className="cursor-pointer">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED" className="cursor-pointer">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listado de Pasajeros vinculados */}
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
                        className="ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Buscador de Pasajeros Existentes */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Agregar pasajero existente</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
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
                              className="text-xs md:text-sm cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{passenger.name}</span>
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

            {/* Botón para crear pasajero nuevo */}
            <Button
              variant="outline"
              onClick={() => setPassengerDialogOpen(true)}
              className="w-full h-8 md:h-9 text-xs md:text-sm cursor-pointer"
            >
              <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
              Crear nuevo pasajero
            </Button>

            {!isEdit && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 md:p-4">
                <p className="text-[11px] md:text-xs text-muted-foreground">
                  Después de crear la reserva, podrás agregar servicios adicionales desde el detalle.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <Button
              variant="outline"
              onClick={() => {
                if (isDirty) setShowDiscardConfirm(true)
                else onOpenChange(false)
              }}
              className="text-xs md:text-sm cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isEdit && selectedPassengers.length === 0}
              className="text-xs md:text-sm cursor-pointer"
            >
              {isEdit ? "Guardar Cambios" : "Crear Reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✨ PassengerDialog con Key Reset dinámico */}
      <PassengerDialog
        key={`pax-dialog-${paxDialogKey}`}
        open={passengerDialogOpen}
        onOpenChange={(isOpen) => {
          setPassengerDialogOpen(isOpen)
          // Cuando se cierra el modal, incrementamos la key para destruir la instancia vieja
          if (!isOpen) {
            setPaxDialogKey(prev => prev + 1)
          }
        }}
        mode="create"
        onSave={(createdPax) => {
          addPassenger(createdPax)
          setPassengers((prev) => [...prev, createdPax])
          onPassengerCreated?.(createdPax)
          setPassengerDialogOpen(false)
        }}
      />

      {/* AlertDialog de Descarte */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en la reserva. Si sales ahora, se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardConfirm(false)
                onOpenChange(false)
              }}
              className="cursor-pointer"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}