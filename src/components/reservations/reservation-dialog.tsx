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
import { X, Plus, UserPlus, Loader2 } from "lucide-react"

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
  isPending?: boolean // 🚀 Recibimos el estado de la mutación desde el padre
}

export function ReservationDialog({
  open,
  mode,
  onOpenChange,
  availablePassengers,
  onConfirm,
  reservation,
  onPassengerCreated,
  isPending = false,
}: ReservationDialogProps) {
  const isEdit = mode === "edit"
  const [paxDialogKey, setPaxDialogKey] = useState(0)

  // Estado del formulario
  const [state, setState] = useState<ReservationState>(ReservationState.PENDING)
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>([])

  // Estado de modales hijos
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Cargar/Resetear datos
  useEffect(() => {
    if (open) {
      if (isEdit && reservation) {
        setState(reservation.state)
        const normalized = reservation.paxReservations.map((paxRes) => ({
          id: paxRes.pax.id,
          name: paxRes.pax.name,
          birthDate: paxRes.pax.birthDate,
          nationality: paxRes.pax.nationality,
          passport: paxRes.pax.passport,
          dni: paxRes.pax.dni,
        }))
        setSelectedPassengers(normalized)
      } else {
        setState(ReservationState.PENDING)
        setSelectedPassengers([])
      }
    }
  }, [open, isEdit, reservation])

  // Dirty Check para el aviso de descarte
  const isDirty = useMemo(() => {
    if (!open) return false
    const initialData = isEdit && reservation
      ? { state: reservation.state, pIds: reservation.paxReservations.map(pr => pr.pax.id).sort().join(",") }
      : { state: ReservationState.PENDING, pIds: "" }

    const currentData = { state, pIds: selectedPassengers.map(p => p.id).sort().join(",") }
    return JSON.stringify(initialData) !== JSON.stringify(currentData)
  }, [state, selectedPassengers, isEdit, reservation, open])

  const removePassenger = (id: string) => setSelectedPassengers(prev => prev.filter(p => p.id !== id))
  
  const addPassenger = (passenger: Pax) => {
    if (!selectedPassengers.find(p => p.id === passenger.id)) {
      setSelectedPassengers(prev => [...prev, passenger])
    }
  }

  const handleConfirm = () => {
    onConfirm({ id: reservation?.id, state, passengers: selectedPassengers })
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (isPending) return // 🛡️ Bloquear cierre si está guardando
          if (!isOpen && isDirty) setShowDiscardConfirm(true)
          else onOpenChange(isOpen)
        }}
      >
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isEdit ? "Editar Reserva" : "Crear Nueva Reserva"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Estado */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Estado</Label>
              <Select disabled={isPending} value={state} onValueChange={(v) => setState(v as ReservationState)}>
                <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pasajeros */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Pasajeros vinculados</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] rounded-lg border border-border bg-muted/50 p-3">
                {selectedPassengers.length === 0 ? (
                  <p className="text-[11px] md:text-xs text-muted-foreground">No hay pasajeros vinculados</p>
                ) : (
                  selectedPassengers.map((p) => (
                    <div key={p.id} className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-secondary text-secondary-foreground text-[11px] md:text-xs border border-border">
                      <span>{p.name}</span>
                      <button disabled={isPending} onClick={() => removePassenger(p.id)} className="ml-1 hover:text-destructive cursor-pointer disabled:opacity-50">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Buscador */}
            <div className="space-y-2">
              <Label className="text-[11px] md:text-xs">Agregar pasajero existente</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={isPending} className="w-full justify-start h-8 md:h-9 text-xs md:text-sm cursor-pointer font-normal">
                    <UserPlus className="mr-2 h-3.5 w-3.5" /> Buscar pasajero
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nombre..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron pasajeros</CommandEmpty>
                      <CommandGroup>
                        {availablePassengers
                          .filter((p) => !selectedPassengers.find((sp) => sp.id === p.id))
                          .map((p) => (
                            <CommandItem key={p.id} onSelect={() => addPassenger(p)} className="cursor-pointer">
                              <div className="flex flex-col">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-[10px] opacity-70">{p.nationality}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" disabled={isPending} onClick={() => setPassengerDialogOpen(true)} className="w-full h-8 md:h-9 text-xs md:text-sm cursor-pointer">
              <Plus className="mr-2 h-3.5 w-3.5" /> Crear nuevo pasajero
            </Button>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" disabled={isPending} onClick={() => isDirty ? setShowDiscardConfirm(true) : onOpenChange(false)} className="text-xs md:text-sm cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isPending || (!isEdit && selectedPassengers.length === 0)} className="text-xs md:text-sm cursor-pointer min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Guardando..." : "Creando..."}
                </>
              ) : (
                isEdit ? "Guardar Cambios" : "Crear Reserva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PassengerDialog
        key={`pax-dialog-${paxDialogKey}`}
        open={passengerDialogOpen}
        onOpenChange={(isOpen) => {
          setPassengerDialogOpen(isOpen)
          if (!isOpen) setPaxDialogKey(prev => prev + 1)
        }}
        mode="create"
        onSave={(newPax) => {
          addPassenger(newPax)
          onPassengerCreated?.(newPax)
          setPassengerDialogOpen(false)
        }}
      />

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>Tienes cambios sin guardar. Si sales ahora, se perderán.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowDiscardConfirm(false); onOpenChange(false); }} className="cursor-pointer">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}