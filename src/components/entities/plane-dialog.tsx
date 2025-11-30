import { useState, useEffect, useRef } from "react";
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

import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

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

// Tipado estricto del Formulario
type FormData = Omit<z.input<typeof createPlaneSchema>, "reservationId" | "segments"> & {
  segments: {
    segmentOrder: number;
    departure: string;
    arrival: string;
    departureDate: Date | undefined;
    arrivalDate: Date | undefined;
    airline?: string;
    flightNumber?: string;
  }[];
};

interface FormErrors extends Partial<Record<string, string>> {
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
    bookingReference: "",
    provider: "",
    totalPrice: 0,
    amountPaid: 0,
    notes: "",
    currency: Currency.USD,
    segments: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        bookingReference: "",
        provider: "",
        totalPrice: 0,
        amountPaid: 0,
        notes: "",
        currency: Currency.USD,
        segments: [],
      });
      setErrors({});
      return;
    }
  
    if (plane) {
      setFormData({
        bookingReference: plane.bookingReference ?? "",
        provider: plane.provider ?? "",
        totalPrice: plane.totalPrice,
        amountPaid: plane.amountPaid,
        notes: plane.notes ?? "",
        currency: plane.currency,
        segments: plane.segments.map((s) => ({
          segmentOrder: s.segmentOrder,
          departure: s.departure,
          arrival: s.arrival,
          departureDate: s.departureDate ? new Date(s.departureDate) : undefined,
          arrivalDate: s.arrivalDate ? new Date(s.arrivalDate) : undefined,
          airline: s.airline ?? "",
          flightNumber: s.flightNumber ?? "",
        })),
      });
    } else {
      setFormData({
        bookingReference: "",
        provider: "",
        totalPrice: 0,
        amountPaid: 0,
        notes: "",
        currency: Currency.USD,
        segments: [],
      });
    }
    setErrors({});
  }, [open, plane]);

  const updateSegment = (
    index: number,
    field: keyof FormData["segments"][number],
    value: string | Date | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSegment = (index: number) => {
    setFormData({
      ...formData,
      segments: formData.segments
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, segmentOrder: i + 1 })),
    });
  };

  const handleSave = async () => {
    const hasInvalidDates = formData.segments.some(
      s => !s.departureDate || !s.arrivalDate
    );
    if (hasInvalidDates) {
      setErrors({ segments: "Todas las fechas son obligatorias." });
      return;
    }

    const isEdit = Boolean(plane);
    const schema = isEdit ? updatePlaneSchema : createPlaneSchema;

    const payloadToValidate = {
      ...formData,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      segments: formData.segments.map((s, i) => ({
        segmentOrder: i + 1,
        departure: s.departure,
        arrival: s.arrival,
        departureDate: s.departureDate!.toISOString(),
        arrivalDate: s.arrivalDate!.toISOString(),
        airline: s.airline || undefined,
        flightNumber: s.flightNumber || undefined,
      })),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      const endpoint = isEdit ? `/planes/${plane!.id}` : "/planes";
      const method = isEdit ? "PATCH" : "POST";

      const saved = await fetchAPI<Plane>(endpoint, {
        method,
        body: JSON.stringify(payloadToValidate),
      });

      onOpenChange(false);
      setTimeout(() => {
        onSave(saved);
      }, 150);

    } catch {
      setErrors({ _general: "Error al guardar el vuelo." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plane || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/planes/${plane.id}`, { method: "DELETE" });
      onDelete?.(plane.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch {
      setErrors({ _general: "Error al eliminar el vuelo." });
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plane ? "Editar Vuelo" : "Crear Vuelo"}</DialogTitle>
        </DialogHeader>

        {errors._general && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3 text-sm text-red-600">
            ⚠️ {errors._general}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {(["bookingReference", "provider"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>
                {key === "bookingReference" ? "Referencia *" : "Proveedor (opcional)"}
              </Label>
              <Input
                id={key}
                value={formData[key]}
                onChange={(e) =>
                  setFormData({ ...formData, [key]: e.target.value })
                }
              />
              {errors[key] && (
                <p className="text-sm text-red-500">{errors[key]}</p>
              )}
            </div>
          ))}

          {(["totalPrice", "amountPaid"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>
                {key === "totalPrice" ? "Precio total *" : "Monto pagado *"}
              </Label>
              <Input
                id={key}
                type="number"
                value={formData[key as keyof FormData] as string | number}
                onChange={(e) =>
                  setFormData({ ...formData, [key]: Number(e.target.value) })
                }
              />
              {errors[key] && (
                <p className="text-sm text-red-500">{errors[key]}</p>
              )}
            </div>
          ))}

          {!plane && (
            <div className="space-y-1">
              <Label>Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(v: Currency) =>
                  setFormData({ ...formData, currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-3">
          <Label>Notas (opcional)</Label>
          <Textarea
            value={formData.notes ?? ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <div className="flex justify-between items-center">
              <Label>Tramos del vuelo *</Label>

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    segments: [
                      ...formData.segments,
                      {
                        segmentOrder: formData.segments.length + 1,
                        departure: "",
                        arrival: "",
                        departureDate: undefined,
                        arrivalDate: undefined,
                        airline: "",
                        flightNumber: "",
                      },
                    ],
                  })
                }
              >
                + Agregar tramo
              </Button>
            </div>
            {errors.segments && (
              <p className="text-sm text-red-500 mt-1">{errors.segments}</p>
            )}
          </div>

          {formData.segments.map((seg, index) => (
            <div key={index} className="border p-4 rounded-md space-y-4 bg-muted/10">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold">
                  Tramo #{index + 1}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 h-8 hover:text-red-600"
                  onClick={() => removeSegment(index)}
                >
                  Eliminar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Origen</Label>
                  <Input
                    placeholder="EZE"
                    value={seg.departure}
                    onChange={(e) =>
                      updateSegment(index, "departure", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Destino</Label>
                  <Input
                    placeholder="MIA"
                    value={seg.arrival}
                    onChange={(e) =>
                      updateSegment(index, "arrival", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Salida</Label>
                  {/* 🔴 CORREGIDO: key estable basada en el índice, NO en la fecha */}
                  <DateTimePicker
                    key={`departure-${index}`} 
                    date={seg.departureDate}
                    setDate={(date) => updateSegment(index, "departureDate", date)}
                    includeTime={true}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Llegada</Label>
                   {/* 🔴 CORREGIDO: key estable basada en el índice */}
                  <DateTimePicker
                    key={`arrival-${index}`}
                    date={seg.arrivalDate}
                    setDate={(date) => updateSegment(index, "arrivalDate", date)}
                    includeTime={true}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Aerolínea"
                  value={seg.airline ?? ""}
                  onChange={(e) =>
                    updateSegment(index, "airline", e.target.value)
                  }
                />
                <Input
                  placeholder="Nro. Vuelo"
                  value={seg.flightNumber ?? ""}
                  onChange={(e) =>
                    updateSegment(index, "flightNumber", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

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
            <Button onClick={handleSave} disabled={loading}>
              {loading
                ? "Guardando..."
                : plane
                  ? "Guardar cambios"
                  : "Crear vuelo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}