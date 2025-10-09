import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hotel, Currency } from "@/lib/types";

interface HotelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel?: Hotel;
  reservationId: string;
  onSave: (hotel: Partial<Hotel>) => void;
  onDelete?: (id: string) => void;
}

export function HotelDialog({ open, onOpenChange, hotel, reservationId, onSave, onDelete }: HotelDialogProps) {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    city: "",
    hotelName: "",
    bookingReference: "",
    totalPrice: "",
    amountPaid: "",
    roomType: "",
    provider: "",
    currency: "USD" as Currency,
  });

  // util para normalizar ISO -> YYYY-MM-DD
  const toYmd = (d?: string) => {
    if (!d) return "";
    // si ya es YYYY-MM-DD, devolvés tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (hotel) {
      setFormData({
        startDate: toYmd(hotel.startDate),
        endDate: toYmd(hotel.endDate),
        city: hotel.city,
        hotelName: hotel.hotelName,
        bookingReference: hotel.bookingReference,
        totalPrice: String(hotel.totalPrice),
        amountPaid: String(hotel.amountPaid),
        roomType: hotel.roomType,
        provider: hotel.provider,
        currency: hotel.currency,
      });
    } else {
      setFormData({
        startDate: "",
        endDate: "",
        city: "",
        hotelName: "",
        bookingReference: "",
        totalPrice: "",
        amountPaid: "",
        roomType: "",
        provider: "",
        currency: "USD",
      });
    }
  }, [hotel, open]);

  const handleSave = () => {
    const total = Number.parseFloat(formData.totalPrice || "0");
    const paid = Number.parseFloat(formData.amountPaid || "0");
    // YYYY-MM-DD -> ISO con "T12:00:00" para evitar TZ shift
    const toIso = (ymd: string) => (ymd ? new Date(`${ymd}T12:00:00`).toISOString() : "");

    const data: Partial<Hotel> = {
      ...(hotel?.id && { id: hotel.id }),
      reservationId,
      startDate: toIso(formData.startDate),
      endDate: toIso(formData.endDate),
      city: formData.city,
      hotelName: formData.hotelName,
      bookingReference: formData.bookingReference,
      totalPrice: total,
      amountPaid: paid,
      roomType: formData.roomType,
      provider: formData.provider,
      currency: formData.currency,
    };

    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{hotel ? "Editar Hotel" : "Crear Hotel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="hotelName">Nombre del hotel *</Label>
              <Input
                id="hotelName"
                value={formData.hotelName}
                onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                placeholder="Fontainebleau Miami Beach"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Miami"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Fecha de entrada *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">Fecha de salida *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="roomType">Tipo de habitación *</Label>
              <Input
                id="roomType"
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                placeholder="Ocean View Suite"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="provider">Proveedor *</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="Booking.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bookingReference">Referencia de reserva *</Label>
              <Input
                id="bookingReference"
                value={formData.bookingReference}
                onChange={(e) => setFormData({ ...formData, bookingReference: e.target.value })}
                placeholder="FB-2025-001"
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
                placeholder="1500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountPaid">Monto pagado *</Label>
              <Input
                id="amountPaid"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                placeholder="1500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {hotel && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(hotel.id);
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
            <Button onClick={handleSave}>{hotel ? "Guardar cambios" : "Crear"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
