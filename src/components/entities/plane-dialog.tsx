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
          departureDate: s.departureDate,
          arrivalDate: s.arrivalDate,
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
  }, [plane, open]);

  // Update a segment
  const updateSegment = (
    index: number,
    field: keyof FormData["segments"][number],
    value: string,
  ) => {
    setFormData({
      ...formData,
      segments: formData.segments!.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    });
  };

  const removeSegment = (index: number) => {
    setFormData({
      ...formData,
      segments: formData.segments!
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, segmentOrder: i + 1 })),
    });
  };

  const handleSave = async () => {
    const isEdit = Boolean(plane);
    const schema = isEdit ? updatePlaneSchema : createPlaneSchema;

    const result = schema.safeParse({
      ...formData,
      segments: formData.segments.map((s, i) => ({
        ...s,
        segmentOrder: i + 1,
      })),
      ...(isEdit ? {} : { reservationId }),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormData;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      bookingReference: formData.bookingReference,
      provider: formData.provider || null,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      notes: formData.notes || null,
      segments: formData.segments.map((s, i) => ({
        segmentOrder: i + 1,
        departure: s.departure,
        arrival: s.arrival,
        departureDate: new Date(s.departureDate).toISOString(),
        arrivalDate: new Date(s.arrivalDate).toISOString(),
        airline: s.airline || null,
        flightNumber: s.flightNumber || null,
      })),
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency,
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/planes/${plane!.id}` : "/planes";
      const method = isEdit ? "PATCH" : "POST";

      const saved = await fetchAPI<Plane>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(saved);
      setTimeout(() => onOpenChange(false), 100);
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
          {[
            { id: "bookingReference", label: "Referencia *" },
            { id: "provider", label: "Proveedor *" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
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

          {[
            { id: "totalPrice", label: "Precio total *" },
            { id: "amountPaid", label: "Monto pagado *" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                type="number"
                value={formData[f.id as keyof FormData] as number}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: Number(e.target.value) })
                }
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-sm text-red-500">
                  {errors[f.id as keyof FormData]}
                </p>
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
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency}</p>
              )}
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

        {/* SEGMENTS */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center">
            <Label>Tramos del vuelo *</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData({
                  ...formData,
                  segments: [
                    ...formData.segments,
                    {
                      segmentOrder: formData.segments.length + 1,
                      departure: "",
                      arrival: "",
                      departureDate: "",
                      arrivalDate: "",
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

          {formData.segments.map((seg, index) => (
            <div key={index} className="border p-3 rounded-md space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Origen (EZE)"
                  value={seg.departure}
                  onChange={(e) =>
                    updateSegment(index, "departure", e.target.value)
                  }
                />
                <Input
                  placeholder="Destino (MIA)"
                  value={seg.arrival}
                  onChange={(e) =>
                    updateSegment(index, "arrival", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={seg.departureDate}
                  onChange={(e) =>
                    updateSegment(index, "departureDate", e.target.value)
                  }
                />
                <Input
                  type="datetime-local"
                  value={seg.arrivalDate}
                  onChange={(e) =>
                    updateSegment(index, "arrivalDate", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Aerolínea (opcional)"
                  value={seg.airline ?? ""}
                  onChange={(e) =>
                    updateSegment(index, "airline", e.target.value)
                  }
                />
                <Input
                  placeholder="Vuelo (opcional)"
                  value={seg.flightNumber ?? ""}
                  onChange={(e) =>
                    updateSegment(index, "flightNumber", e.target.value)
                  }
                />
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeSegment(index)}
              >
                Eliminar tramo
              </Button>
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
    </Dialog>
  );
}
