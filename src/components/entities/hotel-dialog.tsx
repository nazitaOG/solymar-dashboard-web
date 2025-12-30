import { useState, useEffect, useRef, useMemo } from "react";
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

// 1. Constante para valores por defecto
const defaultFormData: FormData = {
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
};

export function HotelDialog({
  open,
  onOpenChange,
  hotel,
  reservationId,
  onSave,
  onDelete,
}: HotelDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // 👈 Nuevo estado
  
  const deleteLock = useRef(false);

  // 🔄 Cargar datos
  useEffect(() => {
    if (hotel) {
      setFormData({
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
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [hotel, open]);

  // 2. Lógica "Dirty Check"
  const isDirty = useMemo(() => {
    const initialData = hotel
      ? {
          city: hotel.city,
          hotelName: hotel.hotelName,
          bookingReference: hotel.bookingReference,
          roomType: hotel.roomType,
          provider: hotel.provider,
          // Timestamps para comparar fechas
          startDate: hotel.startDate ? new Date(hotel.startDate).getTime() : 0,
          endDate: hotel.endDate ? new Date(hotel.endDate).getTime() : 0,
          totalPrice: Number(hotel.totalPrice),
          amountPaid: Number(hotel.amountPaid),
          currency: hotel.currency,
        }
      : {
          ...defaultFormData,
          startDate: 0,
          endDate: 0,
        };

    const currentData = {
      ...formData,
      startDate: formData.startDate?.getTime() ?? 0,
      endDate: formData.endDate?.getTime() ?? 0,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    };

    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, hotel]);

  // 💾 Guardar
  const handleSave = async () => {
    const isEdit = Boolean(hotel);
    const schema = isEdit ? updateHotelSchema : createHotelSchema;

    const newErrors: FormErrors = {};

    if (!formData.startDate) newErrors.startDate = "Requerido";
    if (!formData.endDate) newErrors.endDate = "Requerido";

    const payloadToValidate = {
      ...formData,
      startDate: formData.startDate?.toISOString() ?? "",
      endDate: formData.endDate?.toISOString() ?? "",
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
      startDate: formData.startDate!.toISOString(),
      endDate: formData.endDate!.toISOString(),
      city: formData.city,
      hotelName: formData.hotelName,
      bookingReference: formData.bookingReference,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      roomType: formData.roomType,
      provider: formData.provider,
      ...(isEdit ? {} : { reservationId, currency: formData.currency || "USD" }),
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
      setErrors({ _general: "Ocurrió un error al guardar el hotel." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); 
    if (!hotel || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/hotels/${hotel.id}`, { method: "DELETE" });
      onDelete?.(hotel.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar hotel." });
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
              {hotel ? "Editar Hotel" : "Crear Hotel"}
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
              { id: "hotelName", label: "Nombre del hotel *", placeholder: "Fontainebleau Miami Beach" },
              { id: "city", label: "Ciudad *", placeholder: "Miami" },
              { id: "roomType", label: "Tipo de habitacion (opcional)", placeholder: "Ocean View Suite" },
              { id: "provider", label: "Proveedor *", placeholder: "Booking.com" },
              { id: "bookingReference", label: "Referencia de reserva *", placeholder: "FB-2025-001" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof typeof formData] as string) || ""}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de entrada *</Label>
              <DateTimePicker
                date={formData.startDate}
                setDate={(date) => setFormData({ ...formData, startDate: date })}
                includeTime={false}
              />
              {errors.startDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.startDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              <DateTimePicker
                date={formData.endDate}
                setDate={(date) => setFormData({ ...formData, endDate: date })}
                includeTime={false}
              />
              {errors.endDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.endDate}</p>}
            </div>

            {!hotel && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue />
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
              { id: "totalPrice", label: "Precio total *", placeholder: "1500" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "1000" },
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
              {hotel && (
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
                disabled={loading || (hotel && !isDirty)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading ? "Guardando..." : hotel ? "Guardar cambios" : "Crear"}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el hotel.
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