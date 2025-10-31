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

import type { Excursion } from "@/lib/interfaces/excursion/excursion.interface";
import type { Currency } from "@/lib/interfaces/currency/currency.interface";

interface ExcursionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excursion?: Excursion;
  reservationId: string;
  onSave: (excursion: Partial<Excursion>) => void;
  onDelete?: (id: string) => void;
}

export function ExcursionDialog({
  open,
  onOpenChange,
  excursion,
  reservationId,
  onSave,
  onDelete,
}: ExcursionDialogProps) {
  const [formData, setFormData] = useState({
    excursionName: "",
    origin: "",
    provider: "",
    bookingReference: "",
    excursionDate: "",
    totalPrice: "",
    amountPaid: "",
    notes: "",
    currency: "USD" as Currency,
  });

  // 🔄 Cargar datos si se está editando
  useEffect(() => {
    if (excursion) {
      setFormData({
        excursionName: excursion.excursionName ?? "",
        origin: excursion.origin ?? "",
        provider: excursion.provider ?? "",
        bookingReference: excursion.bookingReference ?? "",
        excursionDate: excursion.excursionDate
          ? excursion.excursionDate.split("T")[0]
          : "",
        totalPrice: String(excursion.totalPrice ?? ""),
        amountPaid: String(excursion.amountPaid ?? ""),
        notes: "",
        currency: excursion.currency ?? "USD",
      });
    } else {
      setFormData({
        excursionName: "",
        origin: "",
        provider: "",
        bookingReference: "",
        excursionDate: "",
        totalPrice: "",
        amountPaid: "",
        notes: "",
        currency: "USD",
      });
    }
  }, [excursion, open]);

  // 🧠 Normaliza fecha
  const toIsoDate = (d: string): string | null =>
    d ? new Date(`${d}T12:00:00`).toISOString() : null;

  // 💾 Guardar excursión
  const handleSave = () => {
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");

    const data: Partial<Excursion> = {
      ...(excursion?.id && { id: excursion.id }),
      reservationId,
      excursionName: formData.excursionName,
      origin: formData.origin,
      provider: formData.provider,
      bookingReference: formData.bookingReference || null,
      excursionDate: toIsoDate(formData.excursionDate) ?? "",
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
          <DialogTitle>
            {excursion ? "Editar Excursión" : "Crear Excursión"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campos principales */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="excursionName">Nombre de la excursión *</Label>
              <Input
                id="excursionName"
                value={formData.excursionName}
                onChange={(e) =>
                  setFormData({ ...formData, excursionName: e.target.value })
                }
                placeholder="Visita guiada a Machu Picchu"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="origin">Origen / Punto de partida *</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                placeholder="Cusco"
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
                placeholder="Peru Travel Agency"
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
                placeholder="EXC-001234"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="excursionDate">Fecha de la excursión *</Label>
              <Input
                id="excursionDate"
                type="date"
                value={formData.excursionDate}
                onChange={(e) =>
                  setFormData({ ...formData, excursionDate: e.target.value })
                }
              />
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
                placeholder="150"
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
              placeholder="Incluye almuerzo y transporte local."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {excursion && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(excursion.id);
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
              {excursion ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
