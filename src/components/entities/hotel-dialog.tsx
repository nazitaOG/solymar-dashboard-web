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
import { MoneyInput } from "@/components/ui/custom/price-input";

interface HotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: Hotel;
  reservationId: string;
  onSave: (hotel: Hotel) => void;
  onDelete?: (id: string) => void;
  mode?: "create" | "edit" | "view";
}

type FormData = Omit<
  z.input<typeof createHotelSchema>,
  "reservationId" | "startDate" | "endDate"
> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
};

interface FormErrors extends Partial<Record<keyof FormData | "_general", string>> {
  _general?: string;
}

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
  mode = "create",
}: HotelDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const deleteLock = useRef(false);

  useEffect(() => {
    if (hotel && open) {
      setFormData({
        startDate: hotel.startDate ? new Date(hotel.startDate) : undefined,
        endDate: hotel.endDate ? new Date(hotel.endDate) : undefined,
        city: hotel.city ?? "",
        hotelName: hotel.hotelName ?? "",
        bookingReference: hotel.bookingReference ?? "",
        totalPrice: Number(hotel.totalPrice ?? 0),
        amountPaid: Number(hotel.amountPaid ?? 0),
        roomType: hotel.roomType ?? "",
        provider: hotel.provider ?? "",
        currency: hotel.currency ?? Currency.USD,
      });
    } else if (open) {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [hotel, open]);

  const isDirty = useMemo(() => {
    const normalize = (data: Partial<FormData> | Hotel) => ({
      city: data.city || "",
      hotelName: data.hotelName || "",
      bookingReference: data.bookingReference || "",
      roomType: data.roomType || "",
      provider: data.provider || "",
      startDate: data.startDate instanceof Date
        ? data.startDate.getTime()
        : data.startDate ? new Date(data.startDate).getTime() : 0,
      endDate: data.endDate instanceof Date
        ? data.endDate.getTime()
        : data.endDate ? new Date(data.endDate).getTime() : 0,
      totalPrice: Number(data.totalPrice || 0),
      amountPaid: Number(data.amountPaid || 0),
      currency: data.currency || Currency.USD,
    });

    const initialNormalized = hotel ? normalize(hotel) : normalize(defaultFormData);
    const currentNormalized = normalize(formData);

    return JSON.stringify(initialNormalized) !== JSON.stringify(currentNormalized);
  }, [formData, hotel]);

  const isView = mode === "view";
  const effectiveIsDirty = isView ? false : isDirty;

  const handleSave = async () => {
    const isEdit = Boolean(hotel);
    const schema = isEdit ? updateHotelSchema : createHotelSchema;
    const newErrors: FormErrors = {};

    if (!formData.startDate) newErrors.startDate = "Requerido";
    if (!formData.endDate) newErrors.endDate = "Requerido";

    // Validamos primero contra Zod para errores de formulario
    const validationResult = schema.safeParse({
      ...formData,
      startDate: formData.startDate?.toISOString() ?? "",
      endDate: formData.endDate?.toISOString() ?? "",
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    });

    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!newErrors[key]) newErrors[key] = err.message;
      });
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado es mayor al total.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEdit && !isDirty) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);

      // 🛠️ FIX: Separamos currency del resto de la data
      const { currency, ...restFormData } = formData;

      const payload = {
        ...restFormData, // Mantiene totalPrice y amountPaid para que se actualicen
        startDate: formData.startDate!.toISOString(),
        endDate: formData.endDate!.toISOString(),
        totalPrice: Number(formData.totalPrice),
        amountPaid: Number(formData.amountPaid),

        // Solo enviamos currency y reservationId si estamos creando (POST)
        // Si estamos editando (PATCH), currency se omite para evitar el error 400
        ...(isEdit
          ? {}
          : { reservationId, currency: currency || Currency.USD }
        ),
      };

      const endpoint = isEdit ? `/hotels/${hotel!.id}` : "/hotels";
      const method = isEdit ? "PATCH" : "POST";

      const savedHotel = await fetchAPI<Hotel>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedHotel);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({ _general: "Error al guardar el hotel." });
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
      if (err instanceof Error) setErrors({ _general: err.message || "Error al eliminar." });
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen && effectiveIsDirty) setShowDiscardConfirm(true);
          else onOpenChange(isOpen);
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer scrollbar-thin"
          onWheel={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            if (effectiveIsDirty) {
              e.preventDefault();
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isView ? "Ver Hotel" : hotel ? "Editar Hotel" : "Crear Hotel"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">⚠️ {errors._general}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {(["hotelName", "city", "roomType", "provider", "bookingReference"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "hotelName" ? "Nombre del hotel *" :
                    id === "city" ? "Ciudad *" :
                      id === "roomType" ? "Tipo de habitacion (opcional)" :
                        id === "provider" ? "Proveedor *" : "Referencia de reserva *"}
                </Label>
                <Input
                  id={id}
                  value={String(formData[id] ?? "")}
                  onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                  placeholder={id === "hotelName" ? "Ej: Fontainebleau" : ""}
                  disabled={isView}
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""} ${errors[id] ? "border-red-500" : ""}`}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de entrada *</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.startDate ? formData.startDate.toLocaleDateString() : "—"}
                </div>
              ) : (
                <DateTimePicker
                  date={formData.startDate}
                  setDate={(date) => setFormData({ ...formData, startDate: date })}
                  includeTime={false}
                />
              )}
              {errors.startDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.startDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.endDate ? formData.endDate.toLocaleDateString() : "—"}
                </div>
              ) : (
                <DateTimePicker
                  date={formData.endDate}
                  setDate={(date) => setFormData({ ...formData, endDate: date })}
                  includeTime={false}
                />
              )}
              {errors.endDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.endDate}</p>}
            </div>

            {!hotel && !isView && (
              <div className="space-y-1">
                <Label className="text-[11px] md:text-xs">Moneda *</Label>
                <Select value={formData.currency} onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(["totalPrice", "amountPaid"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "totalPrice" ? "Precio total *" : "Monto pagado *"}
                </Label>
                <MoneyInput
                  value={Number(formData[id])} // Pasamos el valor numérico del estado
                  onChange={(val) => setFormData({ ...formData, [id]: val })} // Actualizamos estado
                  placeholder={id === "totalPrice" ? "Ej: 1500.00" : "Ej: 0"}
                  disabled={isView}
                  className={`h-8 md:h-9 text-xs md:text-sm ${
                    isView ? "bg-muted/50 cursor-default" : ""
                  } ${errors[id] ? "border-red-500" : ""}`}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <div className="flex-1">
              {!isView && hotel && (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading} className="cursor-pointer text-xs md:text-sm">Eliminar</Button>
              )}
            </div>
            <div className="flex gap-2">
              {isView ? (
                <Button onClick={() => onOpenChange(false)} className="text-xs cursor-pointer md:text-sm">Cerrar</Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => effectiveIsDirty ? setShowDiscardConfirm(true) : onOpenChange(false)}
                    className="text-xs md:text-sm cursor-pointer"
                  >Cancelar</Button>
                  <Button onClick={handleSave} className="text-xs md:text-sm cursor-pointer">Guardar</Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Acción irreversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle><AlertDialogDescription>Se perderán los datos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}