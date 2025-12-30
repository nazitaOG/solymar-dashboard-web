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

// 1. Definimos los valores por defecto afuera para reutilizarlos en comparaciones
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
}: CarRentalDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // 👈 NUEVO ESTADO
  
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
      setFormData(defaultFormData); // Usamos la const
    }
    setErrors({});
  }, [carRental, open]);

  // 2. Lógica "Dirty Check" mejorada: Compara contra el original (Edit) o contra vacíos (Create)
  const isDirty = useMemo(() => {
    const initialData = carRental
      ? {
          provider: carRental.provider ?? "",
          bookingReference: carRental.bookingReference ?? "",
          pickupLocation: carRental.pickupLocation ?? "",
          dropoffLocation: carRental.dropoffLocation ?? "",
          // Para fechas usamos timestamps para comparar fácil
          pickupDate: carRental.pickupDate ? new Date(carRental.pickupDate).getTime() : 0,
          dropoffDate: carRental.dropoffDate ? new Date(carRental.dropoffDate).getTime() : 0,
          carCategory: carRental.carCategory ?? "",
          carModel: carRental.carModel ?? "",
          totalPrice: Number(carRental.totalPrice),
          amountPaid: Number(carRental.amountPaid),
          currency: carRental.currency ?? Currency.USD,
        }
      : {
          ...defaultFormData,
          pickupDate: 0,
          dropoffDate: 0,
        };

    const currentData = {
      ...formData,
      pickupDate: formData.pickupDate?.getTime() ?? 0,
      dropoffDate: formData.dropoffDate?.getTime() ?? 0,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    };

    // Compara campo por campo. Si ALGO es diferente, isDirty es true.
    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, carRental]);

  const handleSave = async () => {
    const isEdit = Boolean(carRental);
    const schema = isEdit ? updateCarRentalSchema : createCarRentalSchema;
    
    const newErrors: FormErrors = {};

    if (!formData.pickupDate) newErrors.pickupDate = "Requerido";
    if (!formData.dropoffDate) newErrors.dropoffDate = "Requerido";

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
        if (!newErrors[key]) newErrors[key] = err.message;
      }
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Si es Edit y no hay cambios, avisamos.
    // Si es Create y está vacío (no dirty), avisamos que debe cargar algo.
    if (isEdit && !isDirty) {
      setErrors({ _general: "No se detectaron cambios para guardar." });
      return;
    }

    const finalPayload = {
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      pickupDate: formData.pickupDate!.toISOString(),
      dropoffDate: formData.dropoffDate!.toISOString(),
      carCategory: formData.carCategory,
      carModel: formData.carModel || null,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId, currency: formData.currency || "USD" }),
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
      setErrors({ _general: "Ocurrió un error al guardar el alquiler." });
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
      {/* DIÁLOGO PRINCIPAL */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        // Interceptamos el cierre por tecla ESC o por setOpen(false) externo
        if (!isOpen && isDirty) {
          setShowDiscardConfirm(true);
        } else {
          onOpenChange(isOpen);
        }
      }}>
        <DialogContent 
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer"
          // 3. INTERCEPTOR CLICK AFUERA
          onInteractOutside={(e) => {
            if (isDirty) {
              e.preventDefault(); // Bloquea el cierre automático
              setShowDiscardConfirm(true); // Muestra la alerta
            }
            // Si no está sucio (isDirty false), deja que se cierre solo.
          }}
        >
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
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Retiro *</Label>
              <DateTimePicker
                date={formData.pickupDate}
                setDate={(date) => setFormData({ ...formData, pickupDate: date })}
                includeTime={true}
              />
              {errors.pickupDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.pickupDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha/Hora Devolución *</Label>
              <DateTimePicker
                date={formData.dropoffDate}
                setDate={(date) => setFormData({ ...formData, dropoffDate: date })}
                includeTime={true}
              />
              {errors.dropoffDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.dropoffDate}</p>}
            </div>

            {[
              { id: "provider", label: "Proveedor *", placeholder: "Hertz, Avis..." },
              { id: "bookingReference", label: "Referencia", placeholder: "RES-12345" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            {[
              { id: "carCategory", label: "Categoría *", placeholder: "Compacto, SUV..." },
              { id: "carModel", label: "Modelo (Opcional)", placeholder: "Toyota Corolla o similar" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            {!carRental && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD" className="cursor-pointer">USD</SelectItem>
                    <SelectItem value="ARS" className="cursor-pointer">ARS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-red-500 text-[10px] md:text-xs">{errors.currency}</p>}
              </div>
            )}

            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "0.00" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "0.00" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  type="number"
                  min={0}
                  value={(formData[f.id as keyof FormData] as number) || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") { setFormData({ ...formData, [f.id]: 0 }); return; }
                    const numValue = Number(value);
                    if (numValue >= 0) { setFormData({ ...formData, [f.id]: numValue }); }
                  }}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "Minus") e.preventDefault(); }}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
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
                // 4. Botón Cancelar también verifica si está sucio
                onClick={() => {
                  if (isDirty) setShowDiscardConfirm(true);
                  else onOpenChange(false);
                }}
                disabled={loading}
                className="text-xs md:text-sm cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                // Habilitamos el botón Create aunque no esté sucio para que salten las validaciones de 'requerido'
                disabled={loading || (carRental && !isDirty)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading ? "Guardando..." : carRental ? "Guardar cambios" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT 1: ELIMINAR */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT 2: DESCARTAR CAMBIOS (NUEVO) */}
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
                setShowDiscardConfirm(false);
                onOpenChange(false); // Cierra forzosamente el modal padre
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