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
  createExcursionSchema,
  updateExcursionSchema,
} from "@/lib/schemas/excursion/excursion.schema";

import type { Excursion } from "@/lib/interfaces/excursion/excursion.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface ExcursionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excursion?: Excursion;
  reservationId: string;
  onSave: (excursion: Excursion) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<
  z.input<typeof createExcursionSchema>,
  "reservationId" | "excursionDate"
> & {
  excursionDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
  _general?: string;
}

// 1. Constante para valores por defecto
const defaultFormData: FormData = {
  excursionName: "",
  origin: "",
  provider: "",
  bookingReference: "",
  excursionDate: undefined,
  totalPrice: 0,
  amountPaid: 0,
  currency: Currency.USD,
};

export function ExcursionDialog({
  open,
  onOpenChange,
  excursion,
  reservationId,
  onSave,
  onDelete,
}: ExcursionDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // 👈 Nuevo estado
  
  const deleteLock = useRef(false);

  // 🔄 Cargar datos
  useEffect(() => {
    if (excursion) {
      setFormData({
        excursionName: excursion.excursionName ?? "",
        origin: excursion.origin ?? "",
        provider: excursion.provider ?? "",
        bookingReference: excursion.bookingReference ?? "",
        excursionDate: excursion.excursionDate
          ? new Date(excursion.excursionDate)
          : undefined,
        totalPrice: excursion.totalPrice ?? 0,
        amountPaid: excursion.amountPaid ?? 0,
        currency: excursion.currency ?? Currency.USD,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [excursion, open]);

  // 2. Lógica "Dirty Check" (¿Hay cambios?)
  const isDirty = useMemo(() => {
    const initialData = excursion
      ? {
          excursionName: excursion.excursionName ?? "",
          origin: excursion.origin ?? "",
          provider: excursion.provider ?? "",
          bookingReference: excursion.bookingReference ?? "",
          // Timestamp para comparar fácil
          excursionDate: excursion.excursionDate
            ? new Date(excursion.excursionDate).getTime()
            : 0,
          totalPrice: Number(excursion.totalPrice ?? 0),
          amountPaid: Number(excursion.amountPaid ?? 0),
          currency: excursion.currency ?? Currency.USD,
        }
      : {
          ...defaultFormData,
          excursionDate: 0,
        };

    const currentData = {
      ...formData,
      excursionDate: formData.excursionDate?.getTime() ?? 0,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    };

    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, excursion]);

  // 💾 Guardar
  const handleSave = async () => {
    const isEdit = Boolean(excursion);
    const schema = isEdit ? updateExcursionSchema : createExcursionSchema;

    const newErrors: FormErrors = {};

    if (!formData.excursionDate) {
      newErrors.excursionDate = "La fecha y hora son obligatorias.";
    }

    const payloadToValidate = {
      ...formData,
      excursionDate: formData.excursionDate?.toISOString() ?? "",
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

    // Validación de cambios vacíos
    if (isEdit && !isDirty) {
      setErrors({ _general: "No se detectaron cambios para guardar." });
      return;
    }

    const payload = {
      excursionName: formData.excursionName,
      origin: formData.origin,
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      excursionDate: formData.excursionDate!.toISOString(),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency || Currency.USD,
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/excursions/${excursion!.id}` : "/excursions";
      const method = isEdit ? "PATCH" : "POST";

      const savedExcursion = await fetchAPI<Excursion>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onOpenChange(false);
      setTimeout(() => onSave(savedExcursion), 150);
    } catch {
      setErrors({ _general: "Ocurrió un error al guardar la excursión." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); 
    if (!excursion || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/excursions/${excursion.id}`, { method: "DELETE" });
      onDelete?.(excursion.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar excursión." });
      }
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      {/* DIÁLOGO PRINCIPAL */}
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          if (!isOpen && isDirty) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent 
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer"
          // 3. INTERCEPTOR CLICK AFUERA
          onInteractOutside={(e) => {
            if (isDirty) {
              e.preventDefault(); 
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {excursion ? "Editar Excursión" : "Crear Excursión"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">
                ⚠️ {errors._general}
              </p>
            </div>
          )}

          {/* Formulario */}
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { id: "excursionName", label: "Nombre de la excursión *", placeholder: "Tour por el Glaciar" },
              { id: "origin", label: "Origen / Punto de partida *", placeholder: "El Calafate" },
              { id: "provider", label: "Proveedor *", placeholder: "Glaciares Travel" },
              { id: "bookingReference", label: "Referencia", placeholder: "EXC-00123" },
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

            {/* Fecha y hora */}
            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha y hora *</Label>
              <DateTimePicker
                date={formData.excursionDate}
                setDate={(date) => setFormData({ ...formData, excursionDate: date })}
                includeTime={true}
              />
              {errors.excursionDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.excursionDate}</p>}
            </div>

            {/* Moneda */}
            {!excursion && (
              <div className="space-y-1">
                <Label className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value={Currency.USD} className="cursor-pointer">USD</SelectItem>
                    <SelectItem value={Currency.ARS} className="cursor-pointer">ARS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-red-500 text-[10px] md:text-xs">{errors.currency}</p>}
              </div>
            )}

            {/* Precios */}
            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "250" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "100" },
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
              {excursion && (
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
                // 4. Botón Cancelar verifica suciedad
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
                disabled={loading || (excursion && !isDirty)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading ? "Guardando..." : excursion ? "Guardar cambios" : "Crear"}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente la excursión.
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

      {/* ALERT 2: DESCARTAR CAMBIOS */}
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