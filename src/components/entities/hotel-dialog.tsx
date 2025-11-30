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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ 1. Importar el componente
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

import {
  createHotelSchema,
  updateHotelSchema,
} from "@/lib/schemas/hotel/hotel.schema";

import { fetchAPI } from "@/lib/api/fetchApi";
import type { Hotel } from "@/lib/interfaces/hotel/hotel.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface HotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: Hotel;
  reservationId: string;
  onSave: (hotel: Hotel) => void;
  onDelete?: (id: string) => void;
}

// ✅ 2. Ajustar FormData para manejar Date | undefined
type FormData = Omit<
  z.input<typeof createHotelSchema>,
  "reservationId" | "startDate" | "endDate"
> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
  _general?: string;
}

export function HotelDialog({
  open,
  onOpenChange,
  hotel,
  reservationId,
  onSave,
  onDelete,
}: HotelDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    startDate: undefined, // Inicializar como undefined
    endDate: undefined,
    city: "",
    hotelName: "",
    bookingReference: "",
    totalPrice: 0,
    amountPaid: 0,
    roomType: "",
    provider: "",
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // 🔄 Prellenar datos al abrir
  useEffect(() => {
    if (hotel) {
      setFormData({
        // ✅ Convertir ISO string a Date
        startDate: hotel.startDate ? new Date(hotel.startDate) : undefined,
        endDate: hotel.endDate ? new Date(hotel.endDate) : undefined,
        city: hotel.city,
        hotelName: hotel.hotelName,
        bookingReference: hotel.bookingReference,
        totalPrice: hotel.totalPrice,
        amountPaid: hotel.amountPaid,
        roomType: hotel.roomType,
        provider: hotel.provider,
        currency: hotel.currency,
      });
    } else {
      setFormData({
        startDate: undefined,
        endDate: undefined,
        city: "",
        hotelName: "",
        bookingReference: "",
        totalPrice: 0,
        amountPaid: 0,
        roomType: "",
        provider: "",
        currency: Currency.USD,
      });
    }
    setErrors({});
  }, [hotel, open]);

  // 🧭 Comparar si hubo cambios (solo modo edición)
  const hasChanges = useMemo(() => {
    if (!hotel) return true;

    // Helper para comparar fechas con seguridad
    const getTime = (d?: Date) => d?.getTime() ?? 0;
    const getIsoTime = (iso?: string | null) => iso ? new Date(iso).getTime() : 0;

    return !(
      getTime(formData.startDate) === getIsoTime(hotel.startDate) &&
      getTime(formData.endDate) === getIsoTime(hotel.endDate) &&
      formData.city === hotel.city &&
      formData.hotelName === hotel.hotelName &&
      formData.bookingReference === hotel.bookingReference &&
      Number(formData.totalPrice) === Number(hotel.totalPrice) &&
      Number(formData.amountPaid) === Number(hotel.amountPaid) &&
      formData.roomType === hotel.roomType &&
      formData.provider === hotel.provider
    );
  }, [formData, hotel]);

  // 💾 Guardar (creación o edición)
  const handleSave = async () => {
    const isEdit = Boolean(hotel);
    const schema = isEdit ? updateHotelSchema : createHotelSchema;

    // 1. Validar fechas manualmente
    if (!formData.startDate || !formData.endDate) {
      setErrors({
        startDate: !formData.startDate ? "Requerido" : undefined,
        endDate: !formData.endDate ? "Requerido" : undefined,
      });
      return;
    }

    // 🚫 Si es edición y no hay cambios
    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    // 2. Preparar payload validable
    const payloadToValidate = {
      ...formData,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const err of result.error.issues) {
        const key = err.path[0] as string;
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

    // 3. Payload final
    const payload = {
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      city: formData.city,
      hotelName: formData.hotelName,
      bookingReference: formData.bookingReference,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      roomType: formData.roomType,
      provider: formData.provider,
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency || "USD",
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/hotels/${hotel!.id}` : "/hotels";
      const method = isEdit ? "PATCH" : "POST";

      const savedHotel = await fetchAPI<Hotel>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedHotel);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el hotel. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar hotel
  const handleDelete = async () => {
    if (!hotel || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/hotels/${hotel.id}`, { method: "DELETE" });
      onDelete?.(hotel.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar hotel:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar hotel." });
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
          <DialogTitle>{hotel ? "Editar Hotel" : "Crear Hotel"}</DialogTitle>
        </DialogHeader>

        {errors._general && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
            <p className="text-sm text-red-600 font-medium flex items-center gap-2">
              ⚠️ {errors._general}
            </p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {/* Campos principales */}
          {[
            { id: "hotelName", label: "Nombre del hotel *", placeholder: "Fontainebleau Miami Beach" },
            { id: "city", label: "Ciudad *", placeholder: "Miami" },
            { id: "roomType", label: "Tipo de habitación *", placeholder: "Ocean View Suite" },
            { id: "provider", label: "Proveedor *", placeholder: "Booking.com" },
            { id: "bookingReference", label: "Referencia de reserva *", placeholder: "FB-2025-001" },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                value={(formData[f.id as keyof typeof formData] as string) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id] && (
                <p className="text-sm text-red-500">
                  {errors[f.id]}
                </p>
              )}
            </div>
          ))}

          {/* ✅ Fechas con DateTimePicker (includeTime={false}) */}
          <div className="space-y-1">
            <Label>Fecha de entrada *</Label>
            <DateTimePicker
              date={formData.startDate}
              setDate={(date) => setFormData({ ...formData, startDate: date })}
              includeTime={false} // 👈 Sin hora
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Fecha de salida *</Label>
            <DateTimePicker
              date={formData.endDate}
              setDate={(date) => setFormData({ ...formData, endDate: date })}
              includeTime={false} // 👈 Sin hora
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate}</p>
            )}
          </div>

          {/* Moneda solo en creación */}
          {!hotel && (
            <div>
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(v: Currency) =>
                  setFormData({ ...formData, currency: v })
                }
              >
                <SelectTrigger id="currency" className="bg-transparent">
                  <SelectValue />
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
            <div key={f.id}>
              <Label htmlFor={f.id}>{f.label}</Label>
              <Input
                id={f.id}
                type="number"
                value={(formData[f.id as keyof FormData] as number) || 0}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: Number(e.target.value) })
                }
                placeholder={f.placeholder}
              />
              {errors[f.id] && (
                <p className="text-sm text-red-500">
                  {errors[f.id]}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          {hotel && (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
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
              disabled={loading || (hotel && !hasChanges)}
            >
              {loading
                ? "Guardando..."
                : hotel
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