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

  // Estado del formulario
  const [state, setState] = useState<ReservationState>(ReservationState.PENDING)
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>([])

  // Lista de pasajeros locales (para el buscador)
  const [passengers, setPassengers] = useState<Pax[]>(availablePassengers)

  // Estado de modales hijos
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false) // 👈 Nuevo estado

  // 🔄 Mantiene sincronizada la lista local
  useEffect(() => {
    setPassengers(availablePassengers)
  }, [availablePassengers])

  // 🧭 Prellenar datos al abrir
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

  // 🔎 Dirty Check (Comparar si hubo cambios)
  const isDirty = useMemo(() => {
    // 1. Estado Inicial
    const initialData =
      isEdit && reservation
        ? {
            state: reservation.state,
            // IDs de pasajeros ordenados para comparar arrays
            passengerIds: reservation.paxReservations
              .map((pr) => pr.pax.id)
              .sort()
              .join(","),
          }
        : {
            state: ReservationState.PENDING,
            passengerIds: "",
          }

    // 2. Estado Actual
    const currentData = {
      state,
      passengerIds: selectedPassengers
        .map((p) => p.id)
        .sort()
        .join(","),
    }

    return JSON.stringify(initialData) !== JSON.stringify(currentData)
  }, [state, selectedPassengers, isEdit, reservation])

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
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          // Interceptamos cierre
          if (!isOpen && isDirty) {
            setShowDiscardConfirm(true)
          } else {
            onOpenChange(isOpen)
          }
        }}
      >
        <DialogContent 
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer"
          // 3. INTERCEPTOR CLICK AFUERA
          onInteractOutside={(e) => {
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
            {/* Estado */}
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
              // 4. Botón Cancelar verifica suciedad
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
              // Bloqueamos crear si no hay pasajeros (a menos que sea edit)
              disabled={!isEdit && selectedPassengers.length === 0}
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
          onPassengerCreated?.(createdPax) 
          setPassengerDialogOpen(false)
        }}
      />

      {/* ALERT: DESCARTAR CAMBIOS */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán los datos ingresados.
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