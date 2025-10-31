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

import type { MedicalAssist } from "@/lib/interfaces/medical_assist/medical_assist.interface";
import type { Currency } from "@/lib/interfaces/currency/currency.interface";

interface MedicalAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assist?: MedicalAssist;
  reservationId: string;
  onSave: (assist: Partial<MedicalAssist>) => void;
  onDelete?: (id: string) => void;
}

export function MedicalAssistDialog({
  open,
  onOpenChange,
  assist,
  reservationId,
  onSave,
  onDelete,
}: MedicalAssistDialogProps) {
  const [formData, setFormData] = useState({
    provider: "",
    bookingReference: "",
    assistType: "",
    totalPrice: "",
    amountPaid: "",
    notes: "",
    currency: "USD" as Currency,
  });

  // 🔄 Cargar datos si se está editando
  useEffect(() => {
    if (assist) {
      setFormData({
        provider: assist.provider ?? "",
        bookingReference: assist.bookingReference ?? "",
        assistType: assist.assistType ?? "",
        totalPrice: String(assist.totalPrice ?? ""),
        amountPaid: String(assist.amountPaid ?? ""),
        notes: "",
        currency: assist.currency ?? "USD",
      });
    } else {
      setFormData({
        provider: "",
        bookingReference: "",
        assistType: "",
        totalPrice: "",
        amountPaid: "",
        notes: "",
        currency: "USD",
      });
    }
  }, [assist, open]);

  // 💾 Guardar asistencia médica
  const handleSave = () => {
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");

    const data: Partial<MedicalAssist> = {
      ...(assist?.id && { id: assist.id }),
      reservationId,
      provider: formData.provider,
      bookingReference: formData.bookingReference,
      assistType: formData.assistType || null,
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
            {assist ? "Editar Asistencia Médica" : "Crear Asistencia Médica"}
          </DialogTitle>
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
                placeholder="Assist Card"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bookingReference">Referencia de reserva *</Label>
              <Input
                id="bookingReference"
                value={formData.bookingReference}
                onChange={(e) =>
                  setFormData({ ...formData, bookingReference: e.target.value })
                }
                placeholder="ASST-00123"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="assistType">Tipo de asistencia</Label>
              <Input
                id="assistType"
                value={formData.assistType}
                onChange={(e) =>
                  setFormData({ ...formData, assistType: e.target.value })
                }
                placeholder="Emergencia médica internacional"
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
                placeholder="500"
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
                placeholder="300"
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
              placeholder="Cobertura de 30 días con asistencia odontológica incluida."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between">
          <div>
            {assist && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(assist.id);
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
              {assist ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
