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

// 🧠 Tipos derivados del schema
type FormData = Omit<z.input<typeof createExcursionSchema>, "reservationId">;
interface FormErrors extends Partial<Record<keyof FormData, string>> {
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
    excursionDate: "",
    totalPrice: 0,
    amountPaid: 0,
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // 🧩 Utilidades
  const toYmd = (iso?: string | null) =>
    iso ? new Date(iso).toISOString().split("T")[0] : "";

  const toIso = (ymd: string) =>
    ymd ? new Date(`${ymd}T12:00:00`).toISOString() : "";

  // 🔄 Cargar datos si se está editando
  useEffect(() => {
    if (excursion) {
      setFormData({
        excursionName: excursion.excursionName ?? "",
        origin: excursion.origin ?? "",
        provider: excursion.provider ?? "",
        bookingReference: excursion.bookingReference ?? "",
        excursionDate: toYmd(excursion.excursionDate),
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
        excursionDate: "",
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
  }, [excursion, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!excursion) return true;
    return !(
      formData.excursionName === excursion.excursionName &&
      formData.origin === excursion.origin &&
      formData.provider === excursion.provider &&
      formData.bookingReference === (excursion.bookingReference ?? "") &&
      formData.excursionDate === toYmd(excursion.excursionDate) &&
      Number(formData.totalPrice) === Number(excursion.totalPrice) &&
      Number(formData.amountPaid) === Number(excursion.amountPaid) &&
      formData.currency === excursion.currency
    );
  }, [formData, excursion]);

  // 💾 Guardar excursión
  const handleSave = async () => {
    const isEdit = Boolean(excursion);
    const schema = isEdit ? updateExcursionSchema : createExcursionSchema;

    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    const result = schema.safeParse({
      ...formData,
      ...(isEdit ? {} : { reservationId }),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
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

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      setErrors({
        amountPaid: "El monto pagado no puede ser mayor que el total.",
      });
      return;
    }

    const payload = {
      excursionName: formData.excursionName,
      origin: formData.origin,
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      excursionDate: toIso(formData.excursionDate),
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

      onSave(savedExcursion);
      setTimeout(() => onOpenChange(false), 100);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {excursion ? "Editar Excursión" : "Crear Excursión"}
          </DialogTitle>
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
          {[
            { id: "excursionName", label: "Nombre de la excursión *", placeholder: "Tour por el Glaciar" },
            { id: "origin", label: "Origen / Punto de partida *", placeholder: "El Calafate" },
            { id: "provider", label: "Proveedor *", placeholder: "Glaciares Travel" },
            { id: "bookingReference", label: "Referencia", placeholder: "EXC-00123" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
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

          <div className="space-y-1">
            <Label htmlFor="excursionDate">Fecha de la excursión *</Label>
            <Input
              id="excursionDate"
              type="date"
              value={formData.excursionDate}
              onChange={(e) =>
                setFormData({ ...formData, excursionDate: e.target.value })
              }
            />
            {errors.excursionDate && (
              <p className="text-sm text-red-500">{errors.excursionDate}</p>
            )}
          </div>

          {/* Moneda (solo en creación) */}
          {!excursion && (
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
                  <SelectItem value={Currency.USD}>USD</SelectItem>
                  <SelectItem value={Currency.ARS}>ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {[
            { id: "totalPrice", label: "Precio total *", placeholder: "250" },
            { id: "amountPaid", label: "Monto pagado *", placeholder: "100" },
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
          {excursion && (
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
              disabled={loading || (excursion && !hasChanges)}
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
  );
}
