import { useState, useEffect, useTransition } from "react"
import { Link } from "react-router"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { DateTimePicker } from "@/components/ui/custom/date-time-picker" // ✅ Importar Custom Picker

import type { Pax } from "@/lib/interfaces/pax/pax.interface"
import { CreatePaxSchema } from "@/lib/schemas/pax/create-pax.schema"
import { fetchAPI } from "@/lib/api/fetchApi"
import { paxToRequest } from "@/lib/utils/pax/pax_transform.utils"
import type { CreatePaxRequest } from "@/lib/interfaces/pax/pax-request.interface"
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger"

// ----------------------------------------------------

interface PassengerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  passenger?: Pax
  mode: "create" | "edit" | "view"
  linkedReservations?: Array<{ id: string; state: string }>
  onSave?: (passenger: Pax) => void
  onDelete?: (id: string) => void
}

// ----------------------------------------------------

// 🛠️ Definimos el tipo del estado local
interface FormDataState {
  name: string
  birthDate: Date | undefined // ✅ Cambio a Date object
  nationality: string
  dniNum: string
  dniExpirationDate: Date | undefined // ✅ Cambio a Date object
  passportNum: string
  passportExpirationDate: Date | undefined // ✅ Cambio a Date object
}

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
  mode,
  linkedReservations = [],
  onSave,
  onDelete,
}: PassengerDialogProps) {
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    birthDate: undefined,
    nationality: "Argentina",
    dniNum: "",
    dniExpirationDate: undefined,
    passportNum: "",
    passportExpirationDate: undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  // Hook para eliminar pasajero
  const { deletePassenger, isPending: isDeleting, error: deleteError } =
    useDeletePassenger({
      onDeleteSuccess: (id) => {
        onDelete?.(id)
        onOpenChange(false)
      },
    })

  // ✨ Limpia todo el formulario
  const resetForm = () => {
    setFormData({
      name: "",
      birthDate: undefined,
      nationality: "Argentina",
      dniNum: "",
      dniExpirationDate: undefined,
      passportNum: "",
      passportExpirationDate: undefined,
    })
  }

  // 🧭 Precarga de datos al abrir o cambiar pasajero
  useEffect(() => {
    // Helper para convertir string ISO o Date a objeto Date
    const toDate = (value?: string | Date | null): Date | undefined => {
      if (!value) return undefined
      const d = typeof value === "string" ? new Date(value) : value
      return isNaN(d.getTime()) ? undefined : d
    }

    if (passenger) {
      const normalizeNationality = (n?: string) => {
        if (!n) return "Argentina"
        return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
      }

      setFormData({
        name: passenger.name,
        birthDate: toDate(passenger.birthDate),
        nationality: normalizeNationality(passenger.nationality),
        dniNum: passenger.dni?.dniNum || "",
        dniExpirationDate: toDate(passenger.dni?.expirationDate),
        passportNum: passenger.passport?.passportNum || "",
        passportExpirationDate: toDate(passenger.passport?.expirationDate),
      })
    } else {
      resetForm()
    }
  }, [passenger, open])

  // 🔥 Reset automático al cerrar el diálogo
  useEffect(() => {
    if (!open) {
      resetForm()
      setErrors({})
    }
  }, [open])

  // 💾 Guardar (crear / editar)
  const handleSave = () => {
    // Prepara los datos para Zod
    // Nota: Convertimos Date a ISO string para asegurar compatibilidad si el schema espera strings
    const zodData = {
      name: formData.name,
      birthDate: formData.birthDate?.toISOString(),
      nationality: formData.nationality,
      dniNum: formData.dniNum || undefined,
      dniExpirationDate: formData.dniExpirationDate?.toISOString() || undefined,
      passportNum: formData.passportNum || undefined,
      passportExpirationDate: formData.passportExpirationDate?.toISOString() || undefined,
    }
  
    // 1️⃣ Validación con Zod
    const result = CreatePaxSchema.safeParse(zodData)
  
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
  
    // 2️⃣ Si pasa Zod
    setErrors({})
  
    startTransition(async () => {
      try {
        const normalized: Partial<Pax> = {
          name: result.data.name,
          birthDate: result.data.birthDate.toISOString(),
          nationality: result.data.nationality,
          dni: result.data.dniNum
            ? {
                dniNum: result.data.dniNum,
                expirationDate: result.data.dniExpirationDate
                  ? result.data.dniExpirationDate.toISOString()
                  : undefined,
              }
            : undefined,
          passport: result.data.passportNum
            ? {
                passportNum: result.data.passportNum,
                expirationDate: result.data.passportExpirationDate
                  ? result.data.passportExpirationDate.toISOString()
                  : undefined,
              }
            : undefined,
        }

        const requestBody: CreatePaxRequest = paxToRequest(normalized)

        let saved: Pax
        if (mode === "create") {
          saved = await fetchAPI<Pax>("/pax", {
            method: "POST",
            body: JSON.stringify(requestBody),
          })
        } else if (mode === "edit" && passenger?.id) {
          saved = await fetchAPI<Pax>(`/pax/${passenger.id}`, {
            method: "PATCH",
            body: JSON.stringify(requestBody),
          })
        } else {
          throw new Error("Modo no válido o pasajero sin ID")
        }

        onSave?.(saved)
        onOpenChange(false)
      } catch (error) {
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Error al guardar el pasajero. Intenta más tarde."
        setErrors({ general: msg })
      }
    })
  }
  
  const isViewMode = mode === "view"
  const isCreateMode = mode === "create"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode
              ? "Crear Pasajero"
              : isViewMode
                ? "Ver Pasajero"
                : "Editar Pasajero"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información básica */}
          <div className="space-y-3">
            <h4 className="font-medium">Información básica</h4>
            <div className="grid gap-3 md:grid-cols-2">
              
              {/* Nombre */}
              <div className="space-y-1">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Juan Pérez"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              {/* ✅ Fecha de nacimiento con Custom Picker */}
              <div className="space-y-1">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <div className={isViewMode ? "opacity-60 pointer-events-none" : ""}>
                  <DateTimePicker
                    date={formData.birthDate}
                    setDate={(date) => setFormData({ ...formData, birthDate: date })}
                    includeTime={false} // Solo fecha
                    label="Seleccionar fecha"
                  />
                </div>
                {errors.birthDate && (
                  <p className="text-red-500 text-sm">{errors.birthDate}</p>
                )}
              </div>

              {/* Nacionalidad */}
              <div className="space-y-1">
                <Label htmlFor="nationality">Nacionalidad *</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) =>
                    setFormData({ ...formData, nationality: value })
                  }
                  disabled={isViewMode}
                >
                  <SelectTrigger
                    id="nationality"
                    className={`bg-transparent ${errors.nationality ? "border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Argentina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.nationality && (
                  <p className="text-red-500 text-sm">{errors.nationality}</p>
                )}
              </div>

            </div>
          </div>

          <Separator />

          {/* DNI */}
          <div className="space-y-3">
            <h4 className="font-medium">DNI</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="dniNum">Número de DNI *</Label>
                <Input
                  id="dniNum"
                  value={formData.dniNum}
                  onChange={(e) => setFormData({ ...formData, dniNum: e.target.value })}
                  disabled={isViewMode}
                  placeholder="12345678"
                  className={errors.dniNum ? "border-red-500" : ""}
                />
                {errors.dniNum && (
                  <p className="text-red-500 text-sm">{errors.dniNum}</p>
                )}
              </div>

              {/* ✅ Vencimiento DNI */}
              <div className="space-y-1">
                <Label htmlFor="dniExpiration">Fecha de vencimiento (Opcional)</Label>
                <div className={isViewMode ? "opacity-60 pointer-events-none" : ""}>
                  <DateTimePicker
                    date={formData.dniExpirationDate}
                    setDate={(date) => setFormData({ ...formData, dniExpirationDate: date })}
                    includeTime={false}
                    label="Seleccionar fecha"
                  />
                </div>
                {errors.dniExpirationDate && (
                  <p className="text-red-500 text-sm">{errors.dniExpirationDate}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Pasaporte */}
          <div className="space-y-3">
            <h4 className="font-medium">Pasaporte</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="passportNum">Número de pasaporte *</Label>
                <Input
                  id="passportNum"
                  value={formData.passportNum}
                  onChange={(e) =>
                    setFormData({ ...formData, passportNum: e.target.value })
                  }
                  disabled={isViewMode}
                  placeholder="AAA123456"
                  className={errors.passportNum ? "border-red-500" : ""}
                />
                {errors.passportNum && (
                  <p className="text-red-500 text-sm">{errors.passportNum}</p>
                )}
              </div>

              {/* ✅ Vencimiento Pasaporte */}
              <div className="space-y-1">
                <Label htmlFor="passportExpiration">Fecha de vencimiento (Opcional)</Label>
                <div className={isViewMode ? "opacity-60 pointer-events-none" : ""}>
                  <DateTimePicker
                    date={formData.passportExpirationDate}
                    setDate={(date) => setFormData({ ...formData, passportExpirationDate: date })}
                    includeTime={false}
                    label="Seleccionar fecha"
                  />
                </div>
                {errors.passportExpirationDate && (
                  <p className="text-red-500 text-sm">
                    {errors.passportExpirationDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Errores */}
          {(errors.general || deleteError) && (
            <p className="text-red-500 text-sm text-center mt-2">
              {errors.general || deleteError}
            </p>
          )}

          {/* Reservas vinculadas */}
          {!isCreateMode && linkedReservations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Reservas vinculadas</h4>
                <div className="flex flex-wrap gap-2">
                  {linkedReservations.map((reservation) => (
                    <Link key={reservation.id} to={`/reservas/${reservation.id}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                      >
                        {reservation.id}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isCreateMode && !isViewMode && (
              <Button
                variant="destructive"
                onClick={() =>
                  passenger?.id && deletePassenger(passenger.id, passenger.name)
                }
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isViewMode ? "Cerrar" : "Cancelar"}
            </Button>
            {!isViewMode && (
              <Button onClick={handleSave} disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : isCreateMode
                    ? "Crear"
                    : "Guardar cambios"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}