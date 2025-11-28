import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchAPI } from "@/lib/api/fetchApi";
// ⚠️ Asumo que crearás este archivo de schemas similar al de transfer
import {
  createCarRentalSchema,
  updateCarRentalSchema,
} from '@/lib/schemas/car_rental/car_rental.schema';

import { CarRental } from "@/lib/interfaces/car_rental/car_rental.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface CarRentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carRental?: CarRental;
  reservationId: string;
  onSave: (carRental: CarRental) => void;
  onDelete?: (id: string) => void;
}

// Generamos el tipo FormData basado en el schema (o manual si no usas zod aun)
type FormData = Omit<z.input<typeof createCarRentalSchema>, "reservationId">;

interface FormErrors extends Partial<Record<keyof FormData, string>> {
  _general?: string;
}

export function CarRentalDialog({
  open,
  onOpenChange,
  carRental,
  reservationId,
  onSave,
  onDelete,
}: CarRentalDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    provider: "",
    bookingReference: "",
    pickupLocation: "",
    dropoffLocation: "",
    pickupDate: "",
    dropoffDate: "",
    carCategory: "",
    carModel: "",
    totalPrice: 0,
    amountPaid: 0,
    currency: "USD" as Currency,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // 🧩 Funciones utilitarias para datetime-local
  // Formato requerido por el input: "YYYY-MM-DDTHH:mm"
  const toDatetimeInput = (iso?: string | null) => {
    if (!iso) return "";
    //const date = new Date(iso);
    // Ajuste simple para que el input muestre la hora local correctamente o UTC según tu lógica
    // Aquí tomamos los primeros 16 caracteres de la ISO string si ya viene formateada, 
    // o formateamos manualmente. 
    // Opción segura:
    return iso.slice(0, 16); 
  };

  const toIso = (localDate: string) =>
    localDate ? new Date(localDate).toISOString() : "";

  // 🔄 Prellenar datos
  useEffect(() => {
    if (carRental) {
      setFormData({
        provider: carRental.provider ?? "",
        bookingReference: carRental.bookingReference ?? "",
        pickupLocation: carRental.pickupLocation ?? "",
        dropoffLocation: carRental.dropoffLocation ?? "",
        // Usamos la función adaptada para datetime-local
        pickupDate: toDatetimeInput(carRental.pickupDate),
        dropoffDate: toDatetimeInput(carRental.dropoffDate),
        carCategory: carRental.carCategory ?? "",
        carModel: carRental.carModel ?? "",
        totalPrice: carRental.totalPrice,
        amountPaid: carRental.amountPaid,
        currency: carRental.currency ?? Currency.USD,
      });
    } else {
      setFormData({
        provider: "",
        bookingReference: "",
        pickupLocation: "",
        dropoffLocation: "",
        pickupDate: "",
        dropoffDate: "",
        carCategory: "",
        carModel: "",
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
  }, [carRental, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!carRental) return true;
    return !(
      formData.provider === carRental.provider &&
      formData.bookingReference === (carRental.bookingReference ?? "") &&
      formData.pickupLocation === carRental.pickupLocation &&
      formData.dropoffLocation === carRental.dropoffLocation &&
      formData.pickupDate === toDatetimeInput(carRental.pickupDate) &&
      formData.dropoffDate === toDatetimeInput(carRental.dropoffDate) &&
      formData.carCategory === carRental.carCategory &&
      formData.carModel === (carRental.carModel ?? "") &&
      Number(formData.totalPrice) === Number(carRental.totalPrice) &&
      Number(formData.amountPaid) === Number(carRental.amountPaid) &&
      formData.currency === carRental.currency
    );
  }, [formData, carRental]);

  // 💾 Guardar alquiler
  const handleSave = async () => {
    const isEdit = Boolean(carRental);
    const schema = isEdit ? updateCarRentalSchema : createCarRentalSchema;

    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    // Validación Zod
    const result = schema.safeParse({
      ...formData,
      ...(isEdit ? {} : { reservationId }),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      // Validamos que sean fechas válidas antes de enviar al schema si este espera Date objects
      // O dejamos strings si el schema espera strings ISO.
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const err of result.error.issues) {
        const key = err.path[0] as keyof FormData;
        fieldErrors[key] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    // Validación Manual Lógica
    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      setErrors({
        amountPaid: "El monto pagado no puede ser mayor que el total.",
      });
      return;
    }

    // Construcción del Payload
    const payload = {
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      pickupDate: toIso(formData.pickupDate),
      dropoffDate: toIso(formData.dropoffDate),
      carCategory: formData.carCategory,
      carModel: formData.carModel || null,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency || "USD",
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/car-rentals/${carRental!.id}` : "/car-rentals";
      const method = isEdit ? "PATCH" : "POST";

      const savedCarRental = await fetchAPI<CarRental>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedCarRental);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el alquiler. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar alquiler
  const handleDelete = async () => {
    if (!carRental || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/car-rentals/${carRental.id}`, { method: "DELETE" });
      onDelete?.(carRental.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar alquiler:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar alquiler." });
      }
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  // 🧱 Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{carRental ? "Editar Alquiler de Auto" : "Nuevo Alquiler de Auto"}</DialogTitle>
        </DialogHeader>

        {/* ⚠️ Error general */}
        {errors._general && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              ⚠️ {errors._general}
            </p>
          </div>
        )}

        {/* Formulario */}
        <div className="grid gap-3 md:grid-cols-2">
          {/* Fila 1: Lugares */}
          {[
            { id: "pickupLocation", label: "Lugar de Retiro *", placeholder: "Aeropuerto MIA" },
            { id: "dropoffLocation", label: "Lugar de Devolución *", placeholder: "Aeropuerto MCO" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                value={formData[f.id as keyof FormData] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

          {/* Fila 2: Fechas (datetime-local) */}
          {[
            { id: "pickupDate", label: "Fecha/Hora Retiro *" },
            { id: "dropoffDate", label: "Fecha/Hora Devolución *" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                type="datetime-local" // ⚠️ Cambio importante respecto a transfer
                value={formData[f.id as keyof FormData] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

          {/* Fila 3: Proveedor y Referencia */}
          {[
             { id: "provider", label: "Proveedor *", placeholder: "Hertz, Avis..." },
             { id: "bookingReference", label: "Referencia", placeholder: "RES-12345" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                value={formData[f.id as keyof FormData] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

          {/* Fila 4: Datos del Vehículo */}
          {[
             { id: "carCategory", label: "Categoría *", placeholder: "Compacto, SUV..." },
             { id: "carModel", label: "Modelo (Opcional)", placeholder: "Toyota Corolla o similar" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                value={formData[f.id as keyof FormData] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

          {/* Fila 5: Moneda (solo create) y Precios */}
          {!carRental && (
            <div className="space-y-1">
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(v: Currency) =>
                  setFormData({ ...formData, currency: v })
                }
              >
                <SelectTrigger id="currency" className="bg-transparent">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {[
            { id: "totalPrice", label: "Precio total *", placeholder: "0.00" },
            { id: "amountPaid", label: "Monto pagado *", placeholder: "0.00" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                type="number"
                value={formData[f.id as keyof FormData] as string | number}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">
                  {errors[f.id as keyof FormData]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between mt-4">
          {carRental && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || (carRental && !hasChanges)}
            >
              {loading
                ? "Guardando..."
                : carRental
                ? hasChanges
                  ? "Guardar cambios"
                  : "Sin cambios"
                : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}