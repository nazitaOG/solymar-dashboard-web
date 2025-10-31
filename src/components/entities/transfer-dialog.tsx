import { useState, useEffect } from "react";
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

import type { Transfer, TransportType } from "@/lib/interfaces/transfer/transfer.interface";
import type { Currency } from "@/lib/interfaces/currency/currency.interface";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer?: Transfer;
  reservationId: string;
  onSave: (transfer: Partial<Transfer>) => void;
  onDelete?: (id: string) => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  transfer,
  reservationId,
  onSave,
  onDelete,
}: TransferDialogProps) {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
    provider: "",
    bookingReference: "",
    transportType: "PICKUP" as TransportType,
    totalPrice: "",
    amountPaid: "",
    notes: "",
    currency: "USD" as Currency,
  });

  // 🔄 Cargar datos si se está editando
  useEffect(() => {
    if (transfer) {
      setFormData({
        origin: transfer.origin ?? "",
        destination: transfer.destination ?? "",
        departureDate: transfer.departureDate?.split("T")[0] ?? "",
        arrivalDate: transfer.arrivalDate?.split("T")[0] ?? "",
        provider: transfer.provider ?? "",
        bookingReference: transfer.bookingReference ?? "",
        transportType: transfer.transportType ?? "OTHER",
        totalPrice: String(transfer.totalPrice ?? ""),
        amountPaid: String(transfer.amountPaid ?? ""),
        notes: "",
        currency: transfer.currency ?? "USD",
      });
    } else {
      setFormData({
        origin: "",
        destination: "",
        departureDate: "",
        arrivalDate: "",
        provider: "",
        bookingReference: "",
        transportType: "PICKUP" as TransportType,
        totalPrice: "",
        amountPaid: "",
        notes: "",
        currency: "USD",
      });
    }
  }, [transfer, open]);

  // 🧠 Normaliza fecha a ISO
  const toIsoDate = (d: string): string | null =>
    d ? new Date(`${d}T12:00:00`).toISOString() : null;

  // 💾 Guardar traslado
  const handleSave = () => {
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");

    const data: Partial<Transfer> = {
      ...(transfer?.id && { id: transfer.id }),
      reservationId,
      origin: formData.origin,
      destination: formData.destination || null,
      departureDate: toIsoDate(formData.departureDate) ?? "",
      arrivalDate: toIsoDate(formData.arrivalDate) ?? "",
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      transportType: formData.transportType,
      totalPrice: total,
      amountPaid: paid,
      currency: formData.currency,
    };

    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transfer ? "Editar Traslado" : "Crear Traslado"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campos principales */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="origin">Origen *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                placeholder="Aeropuerto de Ezeiza"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value })
                }
                placeholder="Hotel Alvear"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="departureDate">Fecha de salida *</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) =>
                  setFormData({ ...formData, departureDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="arrivalDate">Fecha de llegada *</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="provider">Proveedor *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="Remises del Sol"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bookingReference">Referencia de reserva</Label>
              <Input
                id="bookingReference"
                value={formData.bookingReference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bookingReference: e.target.value,
                  })
                }
                placeholder="TRF-00991"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="transportType">Tipo de transporte *</Label>
              <Select
                value={formData.transportType}
                onValueChange={(value: TransportType) =>
                  setFormData({ ...formData, transportType: value })
                }
              >
                <SelectTrigger id="transportType" className="bg-transparent">
                  <SelectValue />
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

            <div className="space-y-1">
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) =>
                  setFormData({ ...formData, currency: value })
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
            </div>

            <div className="space-y-1">
              <Label htmlFor="totalPrice">Precio total *</Label>
              <Input
                id="totalPrice"
                type="number"
                value={formData.totalPrice}
                onChange={(e) =>
                  setFormData({ ...formData, totalPrice: e.target.value })
                }
                placeholder="150"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="amountPaid">Monto pagado *</Label>
              <Input
                id="amountPaid"
                type="number"
                value={formData.amountPaid}
                onChange={(e) =>
                  setFormData({ ...formData, amountPaid: e.target.value })
                }
                placeholder="50"
              />
            </div>
          </div>

          {/* Notas opcionales */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Incluye espera en aeropuerto y traslado de regreso."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {transfer && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(transfer.id);
                  onOpenChange(false);
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {transfer ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
