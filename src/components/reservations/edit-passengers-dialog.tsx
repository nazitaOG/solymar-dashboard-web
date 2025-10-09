import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Plus, UserPlus } from "lucide-react"
import type { Pax } from "@/lib/types"

interface EditPassengersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPassengers: Pax[]
  availablePassengers: Pax[]
  onSave: (passengers: Pax[]) => void
}

export function EditPassengersDialog({
  open,
  onOpenChange,
  currentPassengers,
  availablePassengers,
  onSave,
}: EditPassengersDialogProps) {
  const [selectedPassengers, setSelectedPassengers] = useState<Pax[]>(currentPassengers)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPassenger, setNewPassenger] = useState({
    name: "",
    birthDate: "",
    nationality: "",
    dniNum: "",
    passportNum: "",
  })

  const removePassenger = (id: string) => {
    setSelectedPassengers((prev) => prev.filter((p) => p.id !== id))
  }

  const addPassenger = (passenger: Pax) => {
    if (!selectedPassengers.find((p) => p.id === passenger.id)) {
      setSelectedPassengers((prev) => [...prev, passenger])
    }
  }

  const handleCreatePassenger = () => {
    // API call placeholder: POST /pax
    const created: Pax = {
      id: `pax-${Date.now()}`,
      name: newPassenger.name,
      birthDate: newPassenger.birthDate,
      nationality: newPassenger.nationality,
      ...(newPassenger.dniNum && { dni: { dniNum: newPassenger.dniNum, expirationDate: "" } }),
      ...(newPassenger.passportNum && { passport: { passportNum: newPassenger.passportNum, expirationDate: "" } }),
    }
    addPassenger(created)
    setNewPassenger({ name: "", birthDate: "", nationality: "", dniNum: "", passportNum: "" })
    setShowCreateForm(false)
  }

  const handleSave = () => {
    // API call placeholder: POST /reservations/:id/passengers
    onSave(selectedPassengers)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Pasajeros</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Passengers */}
          <div className="space-y-2">
            <Label>Pasajeros vinculados</Label>
            <div className="flex flex-wrap gap-2">
              {selectedPassengers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pasajeros vinculados</p>
              ) : (
                selectedPassengers.map((passenger) => (
                  <Badge key={passenger.id} variant="secondary" className="gap-2 py-1.5">
                    {passenger.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removePassenger(passenger.id)} />
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Add Existing Passenger */}
          <div className="space-y-2">
            <Label>Agregar pasajero existente</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Buscar pasajero
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nombre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron pasajeros</CommandEmpty>
                    <CommandGroup>
                      {availablePassengers
                        .filter((p) => !selectedPassengers.find((sp) => sp.id === p.id))
                        .map((passenger) => (
                          <CommandItem key={passenger.id} onSelect={() => addPassenger(passenger)}>
                            <div className="flex flex-col">
                              <span className="font-medium">{passenger.name}</span>
                              <span className="text-xs text-muted-foreground">{passenger.nationality}</span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Create New Passenger */}
          {!showCreateForm ? (
            <Button variant="outline" onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Crear nuevo pasajero
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-medium">Nuevo Pasajero</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={newPassenger.name}
                    onChange={(e) => setNewPassenger({ ...newPassenger, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newPassenger.birthDate}
                    onChange={(e) => setNewPassenger({ ...newPassenger, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nationality">Nacionalidad *</Label>
                  <Input
                    id="nationality"
                    value={newPassenger.nationality}
                    onChange={(e) => setNewPassenger({ ...newPassenger, nationality: e.target.value })}
                    placeholder="Argentina"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dniNum">DNI (opcional)</Label>
                  <Input
                    id="dniNum"
                    value={newPassenger.dniNum}
                    onChange={(e) => setNewPassenger({ ...newPassenger, dniNum: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="passportNum">Pasaporte (opcional)</Label>
                  <Input
                    id="passportNum"
                    value={newPassenger.passportNum}
                    onChange={(e) => setNewPassenger({ ...newPassenger, passportNum: e.target.value })}
                    placeholder="AAA123456"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePassenger}
                  size="sm"
                  disabled={!newPassenger.name || !newPassenger.birthDate || !newPassenger.nationality}
                >
                  Crear y agregar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
