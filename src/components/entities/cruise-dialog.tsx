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
  createCruiseSchema,
  updateCruiseSchema,
} from "@/lib/schemas/cruise/cruise.schema";

import type { Cruise } from "@/lib/interfaces/cruise/cruise.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface CruiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cruise?: Cruise;
  reservationId: string;
  onSave: (cruise: Cruise) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<
  z.input<typeof createCruiseSchema>,
  "reservationId" | "startDate" | "endDate"
> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
  _general?: string;
}

export function CruiseDialog({
  open,
  onOpenChange,
  cruise,
  reservationId,
  onSave,
  onDelete,
}: CruiseDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    provider: "",
    embarkationPort: "",
    arrivalPort: "",
    bookingReference: "",
    startDate: undefined,
    endDate: undefined,
    totalPrice: 0,
    amountPaid: 0,
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  // 👇 Nuevo estado para el diálogo de confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteLock = useRef(false);

  // 🔄 Prellenar datos
  useEffect(() => {
    if (cruise) {
      setFormData({
        provider: cruise.provider ?? "",
        embarkationPort: cruise.embarkationPort ?? "",
        arrivalPort: cruise.arrivalPort ?? "",
        bookingReference: cruise.bookingReference ?? "",
        startDate: cruise.startDate ? new Date(cruise.startDate) : undefined,
        endDate: cruise.endDate ? new Date(cruise.endDate) : undefined,
        totalPrice: cruise.totalPrice,
        amountPaid: cruise.amountPaid,
        currency: cruise.currency,
      });
    } else {
      setFormData({
        provider: "",
        embarkationPort: "",
        arrivalPort: "",
        bookingReference: "",
        startDate: undefined,
        endDate: undefined,
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
    setErrors({});
  }, [cruise, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!cruise) return true;

    const getTime = (d?: Date) => d?.getTime() ?? 0;
    const getIsoTime = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

    return !(
      formData.provider === (cruise.provider ?? "") &&
      formData.embarkationPort === (cruise.embarkationPort ?? "") &&
      formData.arrivalPort === (cruise.arrivalPort ?? "") &&
      formData.bookingReference === (cruise.bookingReference ?? "") &&
      getTime(formData.startDate) === getIsoTime(cruise.startDate) &&
      getTime(formData.endDate) === getIsoTime(cruise.endDate) &&
      Number(formData.totalPrice) === Number(cruise.totalPrice) &&
      Number(formData.amountPaid) === Number(cruise.amountPaid) &&
      formData.currency === cruise.currency
    );
  }, [formData, cruise]);

  // 💾 Guardar crucero con validación acumulativa
  const handleSave = async () => {
    const isEdit = Boolean(cruise);
    const schema = isEdit ? updateCruiseSchema : createCruiseSchema;

    // 👇 1. Acumulador de errores
    const newErrors: FormErrors = {};

    // 👇 2. Validación Manual de Fechas
    if (!formData.startDate) {
      newErrors.startDate = "La fecha de salida es obligatoria.";
    }

    // 👇 3. Validación Zod
    const payloadToValidate = {
      ...formData,
      startDate: formData.startDate?.toISOString() ?? "",
      endDate: formData.endDate ? formData.endDate.toISOString() : undefined,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      for (const err of result.error.issues) {
        const key = err.path[0] as string;
        if (!newErrors[key]) {
            newErrors[key] = err.message;
        }
      }
    }

    // 👇 4. Validación Lógica de Precios
    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    // 👇 5. Si hay errores, mostramos todo y cortamos
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 👇 6. Validación de cambios (solo si editamos)
    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    // Preparar payload final
    const finalPayload = {
      provider: formData.provider,
      embarkationPort: formData.embarkationPort,
      arrivalPort: formData.arrivalPort || null,
      bookingReference: formData.bookingReference || null,
      startDate: formData.startDate!.toISOString(), // Seguro porque ya validamos arriba
      endDate: formData.endDate ? formData.endDate.toISOString() : null,
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
      const endpoint = isEdit ? `/cruises/${cruise!.id}` : "/cruises";
      const method = isEdit ? "PATCH" : "POST";

      const savedCruise = await fetchAPI<Cruise>(endpoint, {
        method,
        body: JSON.stringify(finalPayload),
      });

      onOpenChange(false);
      setTimeout(() => onSave(savedCruise), 150);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el crucero. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar crucero
  const handleDelete = async () => {
    setShowDeleteConfirm(false); // Cerramos el modal de confirmación

    if (!cruise || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/cruises/${cruise.id}`, { method: "DELETE" });
      onDelete?.(cruise.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar crucero:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar crucero." });
      }
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  // 🧱 Render
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {cruise ? "Editar Crucero" : "Crear Crucero"}
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
              { id: "provider", label: "Proveedor *", placeholder: "MSC Cruises" },
              { id: "embarkationPort", label: "Puerto de embarque *", placeholder: "Buenos Aires" },
              { id: "arrivalPort", label: "Puerto de llegada", placeholder: "Rio de Janeiro" },
              { id: "bookingReference", label: "Referencia", placeholder: "CR-56789" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label
                  htmlFor={f.id}
                  className="text-[11px] md:text-xs"
                >
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [f.id]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${
                    errors[f.id] ? "border-red-500" : ""
                  }`}
                />
                {errors[f.id] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}

            {/* Fechas */}
            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              <DateTimePicker
                date={formData.startDate}
                setDate={(date) => setFormData({ ...formData, startDate: date })}
                includeTime={false}
              />
              {errors.startDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de llegada</Label>
              <DateTimePicker
                date={formData.endDate}
                setDate={(date) => setFormData({ ...formData, endDate: date })}
                includeTime={false}
              />
              {errors.endDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.endDate}
                </p>
              )}
            </div>

            {/* Moneda (solo en creación) */}
            {!cruise && (
              <div className="space-y-1">
                <Label
                  htmlFor="currency"
                  className="text-[11px] md:text-xs"
                >
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

            {/* 👇 INPUTS DE PRECIOS MEJORADOS (Bloqueo de negativos) */}
            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "2000" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "500" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label
                  htmlFor={f.id}
                  className="text-[11px] md:text-xs"
                >
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  type="number"
                  min={0} // 1. Restricción nativa
                  value={(formData[f.id as keyof FormData] as number) || 0}
                  
                  // 2. Validación en onChange
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

                  // 3. Bloqueo de la tecla menos
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "Minus") {
                      e.preventDefault();
                    }
                  }}
                  
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${
                    errors[f.id] ? "border-red-500" : ""
                  }`}
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
              {cruise && (
                <Button
                  variant="destructive"
                  // 👇 Ahora abre el modal de confirmación
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
                disabled={loading || (cruise && !hasChanges)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading
                  ? "Guardando..."
                  : cruise
                  ? hasChanges
                    ? "Guardar cambios"
                    : "Sin cambios"
                  : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 👇 MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el crucero.
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