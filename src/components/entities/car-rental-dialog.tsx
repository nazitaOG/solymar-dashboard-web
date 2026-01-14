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

import { MoneyInput } from "../ui/custom/price-input";

interface CarRentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carRental?: CarRental;
  reservationId: string;
  onSave: (carRental: CarRental) => void;
  onDelete?: (id: string) => void;
  mode?: "create" | "edit" | "view";
}

type FormData = Omit<
  z.input<typeof createCarRentalSchema>,
  "reservationId" | "pickupDate" | "dropoffDate"
> & {
  pickupDate: Date | undefined;
  dropoffDate: Date | undefined;
};

// Se define FormErrors de forma estricta sin any
interface FormErrors extends Partial<Record<keyof FormData | "_general", string>> {
  _general?: string;
}

const defaultFormData: FormData = {
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
};

export function CarRentalDialog({
  open,
  onOpenChange,
  carRental,
  reservationId,
  onSave,
  onDelete,
  mode = "create",
}: CarRentalDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const deleteLock = useRef(false);

  useEffect(() => {
    if (carRental && open) {
      setFormData({
        provider: carRental.provider ?? "",
        bookingReference: carRental.bookingReference ?? "",
        pickupLocation: carRental.pickupLocation ?? "",
        dropoffLocation: carRental.dropoffLocation ?? "",
        pickupDate: carRental.pickupDate ? new Date(carRental.pickupDate) : undefined,
        dropoffDate: carRental.dropoffDate ? new Date(carRental.dropoffDate) : undefined,
        carCategory: carRental.carCategory ?? "",
        carModel: carRental.carModel ?? "",
        totalPrice: Number(carRental.totalPrice ?? 0),
        amountPaid: Number(carRental.amountPaid ?? 0),
        currency: carRental.currency ?? Currency.USD,
      });
    } else if (open) {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [carRental, open]);

  // isDirty con normalización para evitar cierres falsos por tipos de datos
  const isDirty = useMemo(() => {
    const normalize = (data: Partial<FormData>) => ({
      provider: data.provider || "",
      bookingReference: data.bookingReference || "",
      pickupLocation: data.pickupLocation || "",
      dropoffLocation: data.dropoffLocation || "",
      pickupDate: data.pickupDate instanceof Date ? data.pickupDate.getTime() : 0,
      dropoffDate: data.dropoffDate instanceof Date ? data.dropoffDate.getTime() : 0,
      carCategory: data.carCategory || "",
      carModel: data.carModel || "",
      totalPrice: Number(data.totalPrice || 0),
      amountPaid: Number(data.amountPaid || 0),
      currency: data.currency || Currency.USD,
    });

    const initialNormalized = carRental
      ? normalize({
        ...carRental,
        pickupDate: carRental.pickupDate ? new Date(carRental.pickupDate) : undefined,
        dropoffDate: carRental.dropoffDate ? new Date(carRental.dropoffDate) : undefined,
      })
      : normalize(defaultFormData);

    const currentNormalized = normalize(formData);
    return JSON.stringify(initialNormalized) !== JSON.stringify(currentNormalized);
  }, [formData, carRental]);

  const isView = mode === "view";
  const effectiveIsDirty = isView ? false : isDirty;

  const handleSave = async () => {
    const isEdit = Boolean(carRental);
    const schema = isEdit ? updateCarRentalSchema : createCarRentalSchema;
    const newErrors: FormErrors = {};

    if (!formData.pickupDate) newErrors.pickupDate = "Requerido";
    if (!formData.dropoffDate) newErrors.dropoffDate = "Requerido";

    const result = schema.safeParse({
      ...formData,
      pickupDate: formData.pickupDate?.toISOString() ?? "",
      dropoffDate: formData.dropoffDate?.toISOString() ?? "",
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    });

    if (!result.success) {
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!newErrors[key]) newErrors[key] = err.message;
      });
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEdit && !isDirty) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        pickupDate: formData.pickupDate!.toISOString(),
        dropoffDate: formData.dropoffDate!.toISOString(),
        totalPrice: Number(formData.totalPrice),
        amountPaid: Number(formData.amountPaid),
        ...(isEdit ? {} : { reservationId, currency: formData.currency || "USD" }),
      };

      const endpoint = isEdit ? `/car-rentals/${carRental!.id}` : "/car-rentals";
      const method = isEdit ? "PATCH" : "POST";

      const saved = await fetchAPI<CarRental>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(saved);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({ _general: "Error al guardar el alquiler." });
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
      if (err instanceof Error) setErrors({ _general: err.message || "Error al eliminar." });
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen && effectiveIsDirty) setShowDiscardConfirm(true);
          else onOpenChange(isOpen);
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer scrollbar-thin"
          onWheel={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            if (effectiveIsDirty) {
              e.preventDefault();
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isView ? "Ver Alquiler de Auto" : carRental ? "Editar Alquiler de Auto" : "Nuevo Alquiler de Auto"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">⚠️ {errors._general}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {(["pickupLocation", "dropoffLocation", "provider", "bookingReference", "carCategory", "carModel"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "pickupLocation" ? "Lugar de Retiro *" :
                    id === "dropoffLocation" ? "Lugar de Devolución *" :
                      id === "provider" ? "Proveedor *" :
                        id === "bookingReference" ? "Referencia" :
                          id === "carCategory" ? "Categoría *" : "Modelo (Opcional)"}
                </Label>
                <Input
                  id={id}
                  value={String(formData[id] ?? "")}
                  onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""} ${errors[id] ? "border-red-500" : ""}`}
                  disabled={isView}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Retiro *</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.pickupDate ? formData.pickupDate.toLocaleString() : "—"}
                </div>
              ) : (
                <DateTimePicker date={formData.pickupDate} setDate={(date) => setFormData({ ...formData, pickupDate: date })} includeTime={true} />
              )}
              {errors.pickupDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.pickupDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Devolución *</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.dropoffDate ? formData.dropoffDate.toLocaleString() : "—"}
                </div>
              ) : (
                <DateTimePicker date={formData.dropoffDate} setDate={(date) => setFormData({ ...formData, dropoffDate: date })} includeTime={true} />
              )}
              {errors.dropoffDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.dropoffDate}</p>}
            </div>

            {!carRental && !isView && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select value={formData.currency} onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(["totalPrice", "amountPaid"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "totalPrice" ? "Precio total *" : "Monto pagado *"}
                </Label>
                <MoneyInput
                  value={Number(formData[id])} // Pasamos el valor numérico del estado
                  onChange={(val) => setFormData({ ...formData, [id]: val })} // Actualizamos estado
                  placeholder={id === "totalPrice" ? "Ej: 1500.00" : "Ej: 0"}
                  disabled={isView}
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""
                    } ${errors[id] ? "border-red-500" : ""}`}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {!isView && carRental && (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              {isView ? (
                <Button onClick={() => onOpenChange(false)} className="text-xs md:text-sm cursor-pointer">Cerrar</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => (effectiveIsDirty ? setShowDiscardConfirm(true) : onOpenChange(false))} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                    {loading ? "Guardando..." : carRental ? "Guardar cambios" : "Crear"}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>Tienes cambios sin guardar. Si sales ahora, se perderán los datos ingresados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
              }}
              className="cursor-pointer"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}