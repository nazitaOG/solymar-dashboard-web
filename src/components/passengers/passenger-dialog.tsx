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
import type { Pax } from "@/lib/types"
import { CreatePaxSchema } from "@/lib/schemas/pax/create-pax.schema"
import { fetchAPI } from "@/lib/api/fetchApi"
import { paxToRequest } from "@/lib/utils/pax/pax-transform"
import type { CreatePaxRequest } from "@/lib/types/pax/pax-request"

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

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
  mode,
  linkedReservations = [],
  onSave,
  onDelete,
}: PassengerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    nationality: "",
    dniNum: "",
    dniExpiration: "",
    passportNum: "",
    passportExpiration: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const formatDate = (value?: string | Date | null) => {
      if (!value) return ""
      const date = typeof value === "string" ? new Date(value) : value
      if (isNaN(date.getTime())) return ""
      return date.toISOString().split("T")[0]
    }
  
    if (passenger) {
      setFormData({
        name: passenger.name,
        birthDate: formatDate(passenger.birthDate),
        nationality: passenger.nationality,
        dniNum: passenger.dni?.dniNum || "",
        dniExpiration: formatDate(passenger.dni?.expirationDate),
        passportNum: passenger.passport?.passportNum || "",
        passportExpiration: formatDate(passenger.passport?.expirationDate),
      })
    } else {
      setFormData({
        name: "",
        birthDate: "",
        nationality: "",
        dniNum: "",
        dniExpiration: "",
        passportNum: "",
        passportExpiration: "",
      })
    }
  }, [passenger, open])

  // ----------------------------------------------------
  // 🧩 Guardar pasajero (crear)
  // ----------------------------------------------------
  const handleSave = () => {
    const zodData = {
      name: formData.name,
      birthDate: formData.birthDate,
      nationality: formData.nationality,
      dniNum: formData.dniNum || undefined,
      dniExpirationDate: formData.dniExpiration || undefined,
      passportNum: formData.passportNum || undefined,
      passportExpirationDate: formData.passportExpiration || undefined,
    }

    // ✅ Validación con Zod
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

    setErrors({})

    startTransition(async () => {
      try {
        // 🔹 Normalizamos fechas (Date → ISO string)
        const normalized: Partial<Pax> = {
          name: result.data.name,
          birthDate: result.data.birthDate.toISOString(),
          nationality: result.data.nationality,
          dni: result.data.dniNum
            ? {
              dniNum: result.data.dniNum,
              expirationDate: result.data.dniExpirationDate?.toISOString() ?? "",
            }
            : undefined,
          passport: result.data.passportNum
            ? {
              passportNum: result.data.passportNum,
              expirationDate: result.data.passportExpirationDate?.toISOString() ?? "",
            }
            : undefined,
        }

        const requestBody: CreatePaxRequest = paxToRequest(normalized)

        if (mode === "create") {
          const created = await fetchAPI<Pax>("/pax", {
            method: "POST",
            body: JSON.stringify(requestBody),
          })
          onSave?.(created)
        }

        if (mode === "edit" && passenger?.id) {
          const updated = await fetchAPI<Pax>(`/pax/${passenger.id}`, {
            method: "PATCH",
            body: JSON.stringify(requestBody),
          })
          onSave?.(updated)
        }

        onOpenChange(false)
      } catch (error) {
        console.error("Error guardando pasajero:", error)

        // 🔹 Mostrar mensaje del backend (Prisma, constraint SQL, etc.)
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Error al guardar el pasajero. Intenta más tarde."
        setErrors({ general: msg })
      }
    })
  }


  // ----------------------------------------------------
  // 🗑️ Eliminar pasajero
  // ----------------------------------------------------
  const handleDelete = () => {
    if (!passenger?.id) return

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar a ${passenger.name}?`
    )
    if (!confirmed) return

    startTransition(async () => {
      try {
        console.log("Eliminando pasajero:", passenger.id)
        await fetchAPI<void>(`/pax/${passenger.id}`, { method: "DELETE" })
        if (onDelete) onDelete(passenger.id)
        onOpenChange(false)
      } catch (error) {
        console.error("Error eliminando pasajero:", error)
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Error al eliminar el pasajero. Intenta más tarde."
        setErrors({ general: msg })
      }
    })
  }


  const isViewMode = mode === "view"
  const isCreateMode = mode === "create"

  // ----------------------------------------------------
  // 🖼️ UI
  // ----------------------------------------------------
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

              {/* Fecha de nacimiento */}
              <div className="space-y-1">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                  }
                  disabled={isViewMode}
                  className={errors.birthDate ? "border-red-500" : ""}
                />
                {errors.birthDate && (
                  <p className="text-red-500 text-sm">{errors.birthDate}</p>
                )}
              </div>

              {/* Nacionalidad */}
              <div className="space-y-1">
                <Label htmlFor="nationality">Nacionalidad *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                  disabled={isViewMode}
                  placeholder="Argentina"
                  className={errors.nationality ? "border-red-500" : ""}
                />
                {errors.nationality && (
                  <p className="text-red-500 text-sm">{errors.nationality}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* DNI */}
          <div className="space-y-3">
            <h4 className="font-medium">DNI (opcional)</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="dniNum">Número de DNI</Label>
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

              <div className="space-y-1">
                <Label htmlFor="dniExpiration">Fecha de vencimiento</Label>
                <Input
                  id="dniExpiration"
                  type="date"
                  value={formData.dniExpiration}
                  onChange={(e) =>
                    setFormData({ ...formData, dniExpiration: e.target.value })
                  }
                  disabled={isViewMode}
                  className={errors.dniExpirationDate ? "border-red-500" : ""}
                />
                {errors.dniExpirationDate && (
                  <p className="text-red-500 text-sm">{errors.dniExpirationDate}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Pasaporte */}
          <div className="space-y-3">
            <h4 className="font-medium">Pasaporte (opcional)</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="passportNum">Número de pasaporte</Label>
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

              <div className="space-y-1">
                <Label htmlFor="passportExpiration">Fecha de vencimiento</Label>
                <Input
                  id="passportExpiration"
                  type="date"
                  value={formData.passportExpiration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passportExpiration: e.target.value,
                    })
                  }
                  disabled={isViewMode}
                  className={errors.passportExpirationDate ? "border-red-500" : ""}
                />
                {errors.passportExpirationDate && (
                  <p className="text-red-500 text-sm">
                    {errors.passportExpirationDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error general */}
          {errors.general && (
            <p className="text-red-500 text-sm text-center mt-2">{errors.general}</p>
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
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Eliminando..." : "Eliminar"}
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
