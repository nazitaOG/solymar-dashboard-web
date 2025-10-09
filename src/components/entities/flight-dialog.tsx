import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Plane, Currency } from "@/lib/types";

interface FlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight?: Plane;
  reservationId: string;
  onSave: (flight: Partial<Plane>) => void;
  onDelete?: (id: string) => void;
}

export function FlightDialog({ open, onOpenChange, flight, reservationId, onSave, onDelete }: FlightDialogProps) {
  const [formData, setFormData] = useState({
    departure: "",
    arrival: "",
    departureDate: "",
    arrivalDate: "",
    bookingReference: "",
    provider: "",
    totalPrice: "",
    amountPaid: "",
    notes: "",
    currency: "USD" as Currency,
  });

  useEffect(() => {
    if (flight) {
      setFormData({
        departure: flight.departure,
        arrival: flight.arrival,
        departureDate: flight.departureDate.split("T")[0],
        arrivalDate: flight.arrivalDate.split("T")[0],
        bookingReference: flight.bookingReference,
        provider: flight.provider,
        totalPrice: String(flight.totalPrice),
        amountPaid: String(flight.amountPaid),
        notes: flight.notes || "",
        currency: flight.currency,
      });
    } else {
      setFormData({
        departure: "",
        arrival: "",
        departureDate: "",
        arrivalDate: "",
        bookingReference: "",
        provider: "",
        totalPrice: "",
        amountPaid: "",
        notes: "",
        currency: "USD",
      });
    }
  }, [flight, open]);

  const handleSave = () => {
    // Evitá NaN si los inputs están vacíos
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");

    // Nota: usar "T12:00:00" reduce problemas de TZ moviendo la fecha un día.
    const toIsoDate = (d: string) => (d ? new Date(`${d}T12:00:00`).toISOString() : "");

    const data: Partial<Plane> = {
      ...(flight?.id && { id: flight.id }),
      reservationId,
      departure: formData.departure,
      arrival: formData.arrival,
      departureDate: toIsoDate(formData.departureDate),
      arrivalDate: toIsoDate(formData.arrivalDate),
      bookingReference: formData.bookingReference,
      provider: formData.provider,
      totalPrice: total,
      amountPaid: paid,
      notes: formData.notes,
      currency: formData.currency,
    };

    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{flight ? "Editar Vuelo" : "Crear Vuelo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="departure">Origen *</Label>
              <Input
                id="departure"
                value={formData.departure}
                onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                placeholder="Buenos Aires (EZE)"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="arrival">Destino *</Label>
              <Input
                id="arrival"
                value={formData.arrival}
                onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                placeholder="Miami (MIA)"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="departureDate">Fecha de salida *</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="arrivalDate">Fecha de llegada *</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="provider">Aerolínea *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="American Airlines"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bookingReference">Referencia de reserva *</Label>
              <Input
                id="bookingReference"
                value={formData.bookingReference}
                onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                placeholder="AA-123456"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency">Moneda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) => setFormData({ ...formData, currency: value })}
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
                onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountPaid">Monto pagado *</Label>
              <Input
                id="amountPaid"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="2 maletas incluidas"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {flight && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(flight.id);
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
            <Button onClick={handleSave}>{flight ? "Guardar cambios" : "Crear"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
