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
  createTransferSchema,
  updateTransferSchema,
} from "@/lib/schemas/transfer/transfer.schema";

import { Transfer, TransportType } from "@/lib/interfaces/transfer/transfer.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer?: Transfer;
  reservationId: string;
  onSave: (transfer: Transfer) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<
  z.input<typeof createTransferSchema>,
  "reservationId" | "departureDate" | "arrivalDate"
> & {
  departureDate: Date | undefined;
  arrivalDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
  _general?: string;
}

export function TransferDialog({
  open,
  onOpenChange,
  transfer,
  reservationId,
  onSave,
  onDelete,
}: TransferDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    origin: "",
    destination: "",
    departureDate: undefined,
    arrivalDate: undefined,
    provider: "",
    bookingReference: "",
    transportType: TransportType.TRANSFER,
    totalPrice: 0,
    amountPaid: 0,
    currency: "USD" as Currency,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  // 👇 Nuevo estado para confirmación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteLock = useRef(false);

  // 🔄 Prellenar datos
  useEffect(() => {
    if (transfer) {
      setFormData({
        origin: transfer.origin ?? "",
        destination: transfer.destination ?? "",
        departureDate: transfer.departureDate ? new Date(transfer.departureDate) : undefined,
        arrivalDate: transfer.arrivalDate ? new Date(transfer.arrivalDate) : undefined,
        provider: transfer.provider ?? "",
        bookingReference: transfer.bookingReference ?? "",
        transportType: transfer.transportType ?? TransportType.OTHER,
        totalPrice: transfer.totalPrice,
        amountPaid: transfer.amountPaid,
        currency: transfer.currency ?? Currency.USD,
      });
    } else {
      setFormData({
        origin: "",
        destination: "",
        departureDate: undefined,
        arrivalDate: undefined,
        provider: "",
        bookingReference: "",
        transportType: TransportType.TRANSFER,
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
    setErrors({});
  }, [transfer, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!transfer) return true;

    const getTime = (d?: Date) => d?.getTime() ?? 0;
    const getIsoTime = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

    return !(
      formData.origin === transfer.origin &&
      formData.destination === (transfer.destination ?? "") &&
      getTime(formData.departureDate) === getIsoTime(transfer.departureDate) &&
      getTime(formData.arrivalDate) === getIsoTime(transfer.arrivalDate) &&
      formData.provider === transfer.provider &&
      formData.bookingReference === (transfer.bookingReference ?? "") &&
      formData.transportType === transfer.transportType &&
      Number(formData.totalPrice) === Number(transfer.totalPrice) &&
      Number(formData.amountPaid) === Number(transfer.amountPaid) &&
      formData.currency === transfer.currency
    );
  }, [formData, transfer]);

  // 💾 Guardar traslado con validación acumulativa
  const handleSave = async () => {
    const isEdit = Boolean(transfer);
    const schema = isEdit ? updateTransferSchema : createTransferSchema;

    // 👇 1. Acumulador de errores
    const newErrors: FormErrors = {};

    // 👇 2. Validación manual de fechas
    if (!formData.departureDate) {
      newErrors.departureDate = "Requerido";
    }
    if (!formData.arrivalDate) {
      newErrors.arrivalDate = "Requerido";
    }

    // 👇 3. Validación Zod
    const payloadToValidate = {
      ...formData,
      departureDate: formData.departureDate?.toISOString() ?? "",
      arrivalDate: formData.arrivalDate?.toISOString() ?? "",
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

    // 👇 4. Validación lógica de precios
    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    // 👇 5. Si hay errores, mostrar y detener
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 👇 6. Validación de cambios (solo edición)
    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    const finalPayload = {
      origin: formData.origin,
      destination: formData.destination || null,
      departureDate: formData.departureDate!.toISOString(), // Seguro porque ya validamos
      arrivalDate: formData.arrivalDate!.toISOString(),
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      transportType: formData.transportType,
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
      const endpoint = isEdit ? `/transfers/${transfer!.id}` : "/transfers";
      const method = isEdit ? "PATCH" : "POST";

      const savedTransfer = await fetchAPI<Transfer>(endpoint, {
        method,
        body: JSON.stringify(finalPayload),
      });

      onOpenChange(false);
      setTimeout(() => onSave(savedTransfer), 150);
    } catch {
      setErrors({
        _general: "Ocurrió un error al guardar el traslado. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar traslado
  const handleDelete = async () => {
    setShowDeleteConfirm(false); // Cerrar confirmación

    if (!transfer || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/transfers/${transfer.id}`, { method: "DELETE" });
      onDelete?.(transfer.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar traslado:", err);
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar traslado." });
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
              {transfer ? "Editar Traslado" : "Crear Traslado"}
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
              { id: "origin", label: "Origen *", placeholder: "Aeropuerto Ezeiza" },
              { id: "destination", label: "Destino", placeholder: "Hotel Alvear" },
              { id: "provider", label: "Proveedor *", placeholder: "Remises del Sol" },
              { id: "bookingReference", label: "Referencia", placeholder: "TRF-00123" },
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
                  value={(formData[f.id as keyof typeof formData] as string) || ""}
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

            {/* ✅ DATE TIME PICKERS */}
            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              <DateTimePicker
                date={formData.departureDate}
                setDate={(date) => setFormData({ ...formData, departureDate: date })}
                includeTime={true}
              />
              {errors.departureDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.departureDate}
                </p>
              )}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de llegada *</Label>
              <DateTimePicker
                date={formData.arrivalDate}
                setDate={(date) => setFormData({ ...formData, arrivalDate: date })}
                includeTime={true}
              />
              {errors.arrivalDate && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.arrivalDate}
                </p>
              )}
            </div>

            {/* Tipo de transporte */}
            <div className="space-y-1">
              <Label
                htmlFor="transportType"
                className="text-[11px] md:text-xs"
              >
                Tipo de transporte *
              </Label>
              <Select
                value={formData.transportType}
                onValueChange={(v: TransportType) =>
                  setFormData({ ...formData, transportType: v })
                }
              >
                {/* 👇 cursor-pointer en trigger */}
                <SelectTrigger
                  id="transportType"
                  className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer"
                >
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="text-xs md:text-sm">
                  {/* 👇 cursor-pointer en items */}
                  <SelectItem value={TransportType.TRANSFER} className="cursor-pointer">Transfer</SelectItem>
                  <SelectItem value={TransportType.BUS} className="cursor-pointer">Bus</SelectItem>
                  <SelectItem value={TransportType.TRAIN} className="cursor-pointer">Tren</SelectItem>
                  <SelectItem value={TransportType.FERRY} className="cursor-pointer">Ferry</SelectItem>
                  <SelectItem value={TransportType.OTHER} className="cursor-pointer">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Moneda (solo al crear) */}
            {!transfer && (
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

            {/* 👇 INPUTS DE PRECIOS MEJORADOS */}
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
              {transfer && (
                <Button
                  variant="destructive"
                  // 👇 Abre confirmación
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
                disabled={loading || (transfer && !hasChanges)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading
                  ? "Guardando..."
                  : transfer
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente el traslado.
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