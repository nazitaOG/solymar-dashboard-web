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

export function ExcursionDialog({
  open,
  onOpenChange,
  excursion,
  reservationId,
  onSave,
  onDelete,
}: ExcursionDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    excursionName: "",
    origin: "",
    provider: "",
    bookingReference: "",
    excursionDate: undefined,
    totalPrice: 0,
    amountPaid: 0,
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  // 👇 Nuevo estado para el diálogo de confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteLock = useRef(false);

  // 🔄 Cargar datos si se está editando
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
      setFormData({
        excursionName: "",
        origin: "",
        provider: "",
        bookingReference: "",
        excursionDate: undefined,
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
    setErrors({});
  }, [excursion, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!excursion) return true;

    const getTime = (d?: Date) => d?.getTime() ?? 0;
    const getIsoTime = (iso?: string | null) =>
      iso ? new Date(iso).getTime() : 0;

    return !(
      formData.excursionName === excursion.excursionName &&
      formData.origin === excursion.origin &&
      formData.provider === excursion.provider &&
      formData.bookingReference === (excursion.bookingReference ?? "") &&
      getTime(formData.excursionDate) === getIsoTime(excursion.excursionDate) &&
      Number(formData.totalPrice) === Number(excursion.totalPrice) &&
      Number(formData.amountPaid) === Number(excursion.amountPaid) &&
      formData.currency === excursion.currency
    );
  }, [formData, excursion]);

  // 💾 Guardar excursión con validación acumulativa
  const handleSave = async () => {
    const isEdit = Boolean(excursion);
    const schema = isEdit ? updateExcursionSchema : createExcursionSchema;

    // 👇 1. Acumulador de errores
    const newErrors: FormErrors = {};

    // 👇 2. Validación Manual de Fechas
    if (!formData.excursionDate) {
      newErrors.excursionDate = "La fecha y hora son obligatorias.";
    }

    // 👇 3. Validación Zod
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
        if (!newErrors[key]) {
           newErrors[key] = err.message;
        }
      }
    }

    // 👇 4. Validación Lógica de Precios
    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    // 👇 5. Si hay errores, mostramos todo y cortamos la ejecución
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
    const payload = {
      excursionName: formData.excursionName,
      origin: formData.origin,
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      excursionDate: formData.excursionDate!.toISOString(), // Seguro porque ya validamos arriba
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
      setErrors({
        _general:
          "Ocurrió un error al guardar la excursión. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar excursión
  const handleDelete = async () => {
    setShowDeleteConfirm(false); // Cerramos el modal de confirmación

    if (!excursion || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/excursions/${excursion.id}`, { method: "DELETE" });
      onDelete?.(excursion.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar excursión:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar excursión." });
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
        {/* 👇 [&>button]:cursor-pointer asegura la mano en la X de cerrar */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {excursion ? "Editar Excursión" : "Crear Excursión"}
            </DialogTitle>
          </DialogHeader>

          {/* ⚠️ Error general */}
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
              {
                id: "excursionName",
                label: "Nombre de la excursión *",
                placeholder: "Tour por el Glaciar",
              },
              {
                id: "origin",
                label: "Origen / Punto de partida *",
                placeholder: "El Calafate",
              },
              {
                id: "provider",
                label: "Proveedor *",
                placeholder: "Glaciares Travel",
              },
              {
                id: "bookingReference",
                label: "Referencia",
                placeholder: "EXC-00123",
              },
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

            {/* Fecha y hora */}
            {/* 👇 Se agrega [&>button]:cursor-pointer para el botón del calendario */}
            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label
                htmlFor="excursionDate"
                className="text-[11px] md:text-xs"
              >
                Fecha y hora *
              </Label>
              <DateTimePicker
                date={formData.excursionDate}
                setDate={(date) =>
                  setFormData({ ...formData, excursionDate: date })
                }
                includeTime={true}
              />
              {errors.excursionDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.excursionDate}
                </p>
              )}
            </div>

            {/* Moneda (solo en creación) */}
            {!excursion && (
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
                  {/* 👇 cursor-pointer en trigger */}
                  <SelectTrigger
                    id="currency"
                    className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer"
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    {/* 👇 cursor-pointer en items */}
                    <SelectItem value={Currency.USD} className="cursor-pointer">USD</SelectItem>
                    <SelectItem value={Currency.ARS} className="cursor-pointer">ARS</SelectItem>
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
              {
                id: "totalPrice",
                label: "Precio total *",
                placeholder: "250",
              },
              {
                id: "amountPaid",
                label: "Monto pagado *",
                placeholder: "100",
              },
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

                  // 3. Bloqueo de tecla menos
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

          {/* Footer */}
          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {excursion && (
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
                disabled={loading || (excursion && !hasChanges)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading
                  ? "Guardando..."
                  : excursion
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente la excursión.
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