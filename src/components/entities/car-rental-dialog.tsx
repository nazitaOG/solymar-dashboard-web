import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

import { fetchAPI } from "@/lib/api/fetchApi";
import {
  createCarRentalSchema,
  updateCarRentalSchema,
} from "@/lib/schemas/car_rental/car_rental.schema";

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

type FormData = Omit<
  z.input<typeof createCarRentalSchema>,
  "reservationId" | "pickupDate" | "dropoffDate"
> & {
  pickupDate: Date | undefined;
  dropoffDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
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
    pickupDate: undefined,
    dropoffDate: undefined,
    carCategory: "",
    carModel: "",
    totalPrice: 0,
    amountPaid: 0,
    currency: "USD" as Currency,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteLock = useRef(false);

  useEffect(() => {
    if (carRental) {
      setFormData({
        provider: carRental.provider ?? "",
        bookingReference: carRental.bookingReference ?? "",
        pickupLocation: carRental.pickupLocation ?? "",
        dropoffLocation: carRental.dropoffLocation ?? "",
        pickupDate: carRental.pickupDate ? new Date(carRental.pickupDate) : undefined,
        dropoffDate: carRental.dropoffDate ? new Date(carRental.dropoffDate) : undefined,
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
        pickupDate: undefined,
        dropoffDate: undefined,
        carCategory: "",
        carModel: "",
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
    setErrors({});
  }, [carRental, open]);

  const hasChanges = useMemo(() => {
    if (!carRental) return true;

    const getTime = (d?: Date) => d?.getTime() ?? 0;
    const getIsoTime = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

    return !(
      formData.provider === carRental.provider &&
      formData.bookingReference === (carRental.bookingReference ?? "") &&
      formData.pickupLocation === carRental.pickupLocation &&
      formData.dropoffLocation === carRental.dropoffLocation &&
      getTime(formData.pickupDate) === getIsoTime(carRental.pickupDate) &&
      getTime(formData.dropoffDate) === getIsoTime(carRental.dropoffDate) &&
      formData.carCategory === carRental.carCategory &&
      formData.carModel === (carRental.carModel ?? "") &&
      Number(formData.totalPrice) === Number(carRental.totalPrice) &&
      Number(formData.amountPaid) === Number(carRental.amountPaid) &&
      formData.currency === carRental.currency
    );
  }, [formData, carRental]);

  const handleSave = async () => {
    const isEdit = Boolean(carRental);
    const schema = isEdit ? updateCarRentalSchema : createCarRentalSchema;
    
    // 👇 1. Creamos un acumulador de errores
    const newErrors: FormErrors = {};

    // 👇 2. Validación manual de fechas (acumular, no retornar)
    if (!formData.pickupDate) {
      newErrors.pickupDate = "Requerido";
    }
    if (!formData.dropoffDate) {
      newErrors.dropoffDate = "Requerido";
    }

    // 👇 3. Validación de Zod (acumular)
    const payloadToValidate = {
      ...formData,
      pickupDate: formData.pickupDate?.toISOString() ?? "",
      dropoffDate: formData.dropoffDate?.toISOString() ?? "",
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      for (const err of result.error.issues) {
        const key = err.path[0] as string;
        // Si ya tenemos un error manual (ej. fecha vacía), no lo sobrescribimos con el de Zod
        if (!newErrors[key]) {
          newErrors[key] = err.message;
        }
      }
    }

    // 👇 4. Validación lógica de Precios (acumular)
    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    // 👇 5. SI HAY ERRORES ACUMULADOS, DETENEMOS AQUÍ Y LOS MOSTRAMOS TODOS
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 👇 6. Validación de "Sin cambios" (solo si no hay otros errores de validación)
    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    const finalPayload = {
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      pickupDate: formData.pickupDate!.toISOString(), // El '!' es seguro aquí porque ya validamos arriba
      dropoffDate: formData.dropoffDate!.toISOString(),
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
        body: JSON.stringify(finalPayload),
      });

      onOpenChange(false);
      setTimeout(() => onSave(savedCarRental), 150);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el alquiler. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); 
    
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {carRental ? "Editar Alquiler de Auto" : "Nuevo Alquiler de Auto"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">
                ⚠️ {errors._general}
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { id: "pickupLocation", label: "Lugar de Retiro *", placeholder: "Aeropuerto MIA" },
              { id: "dropoffLocation", label: "Lugar de Devolución *", placeholder: "Aeropuerto MCO" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [f.id]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Retiro *</Label>
              <DateTimePicker
                date={formData.pickupDate}
                setDate={(date) => setFormData({ ...formData, pickupDate: date })}
                includeTime={true}
              />
              {errors.pickupDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.pickupDate}
                </p>
              )}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Devolución *</Label>
              <DateTimePicker
                date={formData.dropoffDate}
                setDate={(date) => setFormData({ ...formData, dropoffDate: date })}
                includeTime={true}
              />
              {errors.dropoffDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.dropoffDate}
                </p>
              )}
            </div>

            {[
              { id: "provider", label: "Proveedor *", placeholder: "Hertz, Avis..." },
              { id: "bookingReference", label: "Referencia", placeholder: "RES-12345" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [f.id]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}

            {[
              { id: "carCategory", label: "Categoría *", placeholder: "Compacto, SUV..." },
              { id: "carModel", label: "Modelo (Opcional)", placeholder: "Toyota Corolla o similar" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [f.id]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}

            {!carRental && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">
                  Moneda *
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) =>
                    setFormData({ ...formData, currency: v })
                  }
                >
                  <SelectTrigger
                    id="currency"
                    className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer"
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD" className="cursor-pointer">USD</SelectItem>
                    <SelectItem value="ARS" className="cursor-pointer">ARS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors.currency}
                  </p>
                )}
              </div>
            )}

            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "0.00" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "0.00" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  type="number"
                  min={0} 
                  value={(formData[f.id as keyof FormData] as number) || 0}
                  
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData({ ...formData, [f.id]: 0 });
                      return;
                    }
                    const numValue = Number(value);
                    if (numValue >= 0) {
                      setFormData({ ...formData, [f.id]: numValue });
                    }
                  }}
                  
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "Minus") {
                      e.preventDefault();
                    }
                  }}

                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {carRental && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="text-xs md:text-sm cursor-pointer"
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="text-xs md:text-sm cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || (carRental && !hasChanges)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading
                  ? "Guardando..."
                  : carRental
                  ? "Guardar cambios"
                  : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del alquiler.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}