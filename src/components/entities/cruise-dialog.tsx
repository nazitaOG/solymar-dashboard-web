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

import type { Cruise } from "@/lib/interfaces/cruise/cruise.interface";
import type { Currency } from "@/lib/interfaces/currency/currency.interface";

interface CruiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cruise?: Cruise;
  reservationId: string;
  onSave: (cruise: Partial<Cruise>) => void;
  onDelete?: (id: string) => void;
}

export function CruiseDialog({
  open,
  onOpenChange,
  cruise,
  reservationId,
  onSave,
  onDelete,
}: CruiseDialogProps) {
  const [formData, setFormData] = useState({
    provider: "",
    embarkationPort: "",
    arrivalPort: "",
    bookingReference: "",
    startDate: "",
    endDate: "",
    totalPrice: "",
    amountPaid: "",
    notes: "",
    currency: "USD" as Currency,
  });

  // 🔄 Cargar datos si se está editando
  useEffect(() => {
    if (cruise) {
      setFormData({
        provider: cruise.provider ?? "",
        embarkationPort: cruise.embarkationPort ?? "",
        arrivalPort: cruise.arrivalPort ?? "",
        bookingReference: cruise.bookingReference ?? "",
        startDate: cruise.startDate ? cruise.startDate.split("T")[0] : "",
        endDate: cruise.endDate ? cruise.endDate.split("T")[0] : "",
        totalPrice: String(cruise.totalPrice ?? ""),
        amountPaid: String(cruise.amountPaid ?? ""),
        notes: "",
        currency: cruise.currency ?? "USD",
      });
    } else {
      setFormData({
        provider: "",
        embarkationPort: "",
        arrivalPort: "",
        bookingReference: "",
        startDate: "",
        endDate: "",
        totalPrice: "",
        amountPaid: "",
        notes: "",
        currency: "USD",
      });
    }
  }, [cruise, open]);

  // 🧠 Normaliza fecha
  const toIsoDate = (d: string): string | null =>
    d ? new Date(`${d}T12:00:00`).toISOString() : null;

  // 💾 Guardar crucero
  const handleSave = () => {
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");

    const data: Partial<Cruise> = {
      ...(cruise?.id && { id: cruise.id }),
      reservationId,
      provider: formData.provider,
      embarkationPort: formData.embarkationPort,
      arrivalPort: formData.arrivalPort || null,
      bookingReference: formData.bookingReference || null,
      startDate: toIsoDate(formData.startDate) ?? "",
      endDate: toIsoDate(formData.endDate),
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
          <DialogTitle>{cruise ? "Editar Crucero" : "Crear Crucero"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campos principales */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="provider">Proveedor *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="MSC Cruises"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="embarkationPort">Puerto de embarque *</Label>
              <Input
                id="embarkationPort"
                value={formData.embarkationPort}
                onChange={(e) =>
                  setFormData({ ...formData, embarkationPort: e.target.value })
                }
                placeholder="Buenos Aires"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="arrivalPort">Puerto de llegada</Label>
              <Input
                id="arrivalPort"
                value={formData.arrivalPort}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalPort: e.target.value })
                }
                placeholder="Rio de Janeiro"
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
                placeholder="CR-56789"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate">Fecha de inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate">Fecha de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
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
                placeholder="2000"
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
                placeholder="500"
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
              placeholder="Incluye comidas, bebidas y excursiones locales."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {cruise && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(cruise.id);
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
              {cruise ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
