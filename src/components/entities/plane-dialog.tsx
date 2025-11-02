import { useState, useEffect, useRef, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchAPI } from "@/lib/api/fetchApi";
import {
  createPlaneSchema,
  updatePlaneSchema,
} from "@/lib/schemas/plane/plane.schema";

import type { Plane } from "@/lib/interfaces/plane/plane.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface PlaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plane?: Plane;
  reservationId: string;
  onSave: (plane: Plane) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<z.input<typeof createPlaneSchema>, "reservationId">;

interface FormErrors extends Partial<Record<keyof FormData, string>> {
  _general?: string;
}

export function PlaneDialog({
  open,
  onOpenChange,
  plane,
  reservationId,
  onSave,
  onDelete,
}: PlaneDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    departure: "",
    arrival: "",
    departureDate: "",
    arrivalDate: "",
    bookingReference: "",
    provider: "",
    totalPrice: 0,
    amountPaid: 0,
    notes: "",
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  const toYmd = (d?: string | null): string => {
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const toIso = (ymd: string): string =>
    ymd ? new Date(`${ymd}T12:00:00`).toISOString() : "";

  // 🧩 Prellenar datos al abrir
  useEffect(() => {
    if (plane) {
      setFormData({
        departure: plane.departure ?? "",
        arrival: plane.arrival ?? "",
        departureDate: toYmd(plane.departureDate),
        arrivalDate: toYmd(plane.arrivalDate),
        bookingReference: plane.bookingReference ?? "",
        provider: plane.provider ?? "",
        totalPrice: plane.totalPrice,
        amountPaid: plane.amountPaid,
        notes: plane.notes ?? "",
        currency: plane.currency,
      });
    } else {
      setFormData({
        departure: "",
        arrival: "",
        departureDate: "",
        arrivalDate: "",
        bookingReference: "",
        provider: "",
        totalPrice: 0,
        amountPaid: 0,
        notes: "",
        currency: Currency.USD,
      });
    }
  }, [plane, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!plane) return true;
    return !(
      formData.departure === (plane.departure ?? "") &&
      formData.arrival === (plane.arrival ?? "") &&
      formData.departureDate === toYmd(plane.departureDate) &&
      formData.arrivalDate === toYmd(plane.arrivalDate) &&
      formData.bookingReference === (plane.bookingReference ?? "") &&
      formData.provider === (plane.provider ?? "") &&
      Number(formData.totalPrice) === Number(plane.totalPrice) &&
      Number(formData.amountPaid) === Number(plane.amountPaid) &&
      formData.notes === (plane.notes ?? "")
    );
  }, [formData, plane]);

  // 💾 Guardar vuelo
  const handleSave = async () => {
    const isEdit = Boolean(plane);
    const schema = isEdit ? updatePlaneSchema : createPlaneSchema;

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
      departure: formData.departure,
      arrival: formData.arrival || null,
      departureDate: toIso(formData.departureDate),
      arrivalDate: toIso(formData.arrivalDate),
      bookingReference: formData.bookingReference,
      provider: formData.provider || null,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      notes: formData.notes || null,
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency || "USD",
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/planes/${plane!.id}` : "/planes";
      const method = isEdit ? "PATCH" : "POST";

      const savedPlane = await fetchAPI<Plane>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedPlane);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el vuelo. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar vuelo
  const handleDelete = async () => {
    if (!plane || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/planes/${plane.id}`, { method: "DELETE" });
      onDelete?.(plane.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar vuelo:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar vuelo." });
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
          <DialogTitle>{plane ? "Editar Vuelo" : "Crear Vuelo"}</DialogTitle>
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
          {/* Origen / Destino */}
          {[
            { id: "departure", label: "Origen *", placeholder: "Buenos Aires (EZE)" },
            { id: "arrival", label: "Destino *", placeholder: "Miami (MIA)" },
            { id: "provider", label: "Aerolínea *", placeholder: "American Airlines" },
            { id: "bookingReference", label: "Referencia *", placeholder: "AA-123456" },
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

          {/* Fechas */}
          {[
            { id: "departureDate", label: "Fecha de salida *" },
            { id: "arrivalDate", label: "Fecha de llegada *" },
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
          {!plane && (
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

          {/* Precios */}
          {[
            { id: "totalPrice", label: "Precio total *", placeholder: "1500" },
            { id: "amountPaid", label: "Monto pagado *", placeholder: "1000" },
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

        {/* Notas */}
        <div className="mt-3">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="2 maletas incluidas, asiento 14B..."
            rows={3}
          />
          {errors.notes && (
            <p className="text-sm text-red-500">{errors.notes}</p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between mt-4">
          {plane && (
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
              disabled={loading || (plane && !hasChanges)}
            >
              {loading
                ? "Guardando..."
                : plane
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
