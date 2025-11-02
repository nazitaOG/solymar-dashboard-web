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

type FormData = Omit<z.input<typeof createCruiseSchema>, "reservationId">;
interface FormErrors extends Partial<Record<keyof FormData, string>> {
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
    startDate: "",
    endDate: "",
    totalPrice: 0,
    amountPaid: 0,
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // Utilidades fecha
  const toYmd = (d?: string | null) => {
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      dt.getDate()
    ).padStart(2, "0")}`;
  };

  const toIso = (ymd: string) =>
    ymd ? new Date(`${ymd}T12:00:00`).toISOString() : "";

  // 🧩 Prellenar datos al abrir
  useEffect(() => {
    if (cruise) {
      setFormData({
        provider: cruise.provider ?? "",
        embarkationPort: cruise.embarkationPort ?? "",
        arrivalPort: cruise.arrivalPort ?? "",
        bookingReference: cruise.bookingReference ?? "",
        startDate: toYmd(cruise.startDate),
        endDate: toYmd(cruise.endDate),
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
        startDate: "",
        endDate: "",
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
  }, [cruise, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!cruise) return true;
    return !(
      formData.provider === (cruise.provider ?? "") &&
      formData.embarkationPort === (cruise.embarkationPort ?? "") &&
      formData.arrivalPort === (cruise.arrivalPort ?? "") &&
      formData.bookingReference === (cruise.bookingReference ?? "") &&
      formData.startDate === toYmd(cruise.startDate) &&
      formData.endDate === toYmd(cruise.endDate) &&
      Number(formData.totalPrice) === Number(cruise.totalPrice) &&
      Number(formData.amountPaid) === Number(cruise.amountPaid) &&
      formData.currency === cruise.currency
    );
  }, [formData, cruise]);

  // 💾 Guardar crucero
  const handleSave = async () => {
    const isEdit = Boolean(cruise);
    const schema = isEdit ? updateCruiseSchema : createCruiseSchema;

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
      provider: formData.provider,
      embarkationPort: formData.embarkationPort,
      arrivalPort: formData.arrivalPort || null,
      bookingReference: formData.bookingReference || null,
      startDate: toIso(formData.startDate),
      endDate: formData.endDate ? toIso(formData.endDate) : null,
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
        body: JSON.stringify(payload),
      });

      onSave(savedCruise);
      setTimeout(() => onOpenChange(false), 100);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cruise ? "Editar Crucero" : "Crear Crucero"}</DialogTitle>
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
            { id: "provider", label: "Proveedor *", placeholder: "MSC Cruises" },
            { id: "embarkationPort", label: "Puerto de embarque *", placeholder: "Buenos Aires" },
            { id: "arrivalPort", label: "Puerto de llegada", placeholder: "Rio de Janeiro" },
            { id: "bookingReference", label: "Referencia", placeholder: "CR-56789" },
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

          {[
            { id: "startDate", label: "Fecha de salida *" },
            { id: "endDate", label: "Fecha de llegada" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                type="date"
                value={formData[f.id as keyof FormData] as string}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">
                  {errors[f.id as keyof FormData]}
                </p>
              )}
            </div>
          ))}

          {/* Moneda (solo en creación) */}
          {!cruise && (
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
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency}</p>
              )}
            </div>
          )}

          {[
            { id: "totalPrice", label: "Precio total *", placeholder: "2000" },
            { id: "amountPaid", label: "Monto pagado *", placeholder: "500" },
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
          {cruise && (
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
              disabled={loading || (cruise && !hasChanges)}
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
  );
}
