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

type FormData = Omit<z.input<typeof createTransferSchema>, "reservationId">;
interface FormErrors extends Partial<Record<keyof FormData, string>> {
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
    departureDate: "",
    arrivalDate: "",
    provider: "",
    bookingReference: "",
    transportType: "PICKUP" as TransportType,
    totalPrice: 0,
    amountPaid: 0,
    currency: "USD" as Currency,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // 🧩 Funciones utilitarias
  const toYmd = (iso?: string | null) =>
    iso ? new Date(iso).toISOString().split("T")[0] : "";

  const toIso = (ymd: string) =>
    ymd ? new Date(`${ymd}T12:00:00`).toISOString() : "";

  // 🔄 Prellenar datos
  useEffect(() => {
    if (transfer) {
      setFormData({
        origin: transfer.origin ?? "",
        destination: transfer.destination ?? "",
        departureDate: toYmd(transfer.departureDate),
        arrivalDate: toYmd(transfer.arrivalDate),
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
        departureDate: "",
        arrivalDate: "",
        provider: "",
        bookingReference: "",
        transportType: TransportType.PICKUP,
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
  }, [transfer, open]);

  // 🧭 Detectar cambios
  const hasChanges = useMemo(() => {
    if (!transfer) return true;
    return !(
      formData.origin === transfer.origin &&
      formData.destination === (transfer.destination ?? "") &&
      formData.departureDate === toYmd(transfer.departureDate) &&
      formData.arrivalDate === toYmd(transfer.arrivalDate) &&
      formData.provider === transfer.provider &&
      formData.bookingReference === (transfer.bookingReference ?? "") &&
      formData.transportType === transfer.transportType &&
      Number(formData.totalPrice) === Number(transfer.totalPrice) &&
      Number(formData.amountPaid) === Number(transfer.amountPaid) &&
      formData.currency === transfer.currency
    );
  }, [formData, transfer]);

  // 💾 Guardar traslado
  const handleSave = async () => {
    const isEdit = Boolean(transfer);
    const schema = isEdit ? updateTransferSchema : createTransferSchema;

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
      origin: formData.origin,
      destination: formData.destination || null,
      departureDate: toIso(formData.departureDate),
      arrivalDate: toIso(formData.arrivalDate),
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
        body: JSON.stringify(payload),
      });

      onSave(savedTransfer);
      setTimeout(() => onOpenChange(false), 100);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transfer ? "Editar Traslado" : "Crear Traslado"}</DialogTitle>
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
            { id: "origin", label: "Origen *", placeholder: "Aeropuerto Ezeiza" },
            { id: "destination", label: "Destino", placeholder: "Hotel Alvear" },
            { id: "provider", label: "Proveedor *", placeholder: "Remises del Sol" },
            { id: "bookingReference", label: "Referencia", placeholder: "TRF-00123" },
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
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

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
                <p className="text-sm text-red-500">{errors[f.id as keyof FormData]}</p>
              )}
            </div>
          ))}

          {/* Tipo de transporte */}
          <div className="space-y-1">
            <Label htmlFor="transportType">Tipo de transporte *</Label>
            <Select
              value={formData.transportType}
              onValueChange={(v: TransportType) =>
                setFormData({ ...formData, transportType: v })
              }
            >
              <SelectTrigger id="transportType" className="bg-transparent">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PICKUP">Pickup</SelectItem>
                <SelectItem value="BUS">Bus</SelectItem>
                <SelectItem value="TRAIN">Tren</SelectItem>
                <SelectItem value="FERRY">Ferry</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Moneda (solo al crear) */}
          {!transfer && (
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
          {transfer && (
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
              disabled={loading || (transfer && !hasChanges)}
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
  );
}
