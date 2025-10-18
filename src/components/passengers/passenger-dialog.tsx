import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Pax } from "@/lib/types";

interface PassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger?: Pax;
  mode: "create" | "edit" | "view";
  linkedReservations?: Array<{ id: string; state: string }>;
  onSave: (passenger: Partial<Pax>) => void;
  onDelete?: (id: string) => void;
}

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
  mode,
  linkedReservations = [],
  onSave,
  onDelete,
}: PassengerDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    nationality: "",
    dniNum: "",
    dniExpiration: "",
    passportNum: "",
    passportExpiration: "",
  });

  useEffect(() => {
    if (passenger) {
      setFormData({
        name: passenger.name,
        birthDate: passenger.birthDate,
        nationality: passenger.nationality,
        dniNum: passenger.dni?.dniNum || "",
        dniExpiration: passenger.dni?.expirationDate || "",
        passportNum: passenger.passport?.passportNum || "",
        passportExpiration: passenger.passport?.expirationDate || "",
      });
    } else {
      setFormData({
        name: "",
        birthDate: "",
        nationality: "",
        dniNum: "",
        dniExpiration: "",
        passportNum: "",
        passportExpiration: "",
      });
    }
  }, [passenger, open]);

  const handleSave = () => {
    const data: Partial<Pax> = {
      ...(passenger?.id && { id: passenger.id }),
      name: formData.name,
      birthDate: formData.birthDate,
      nationality: formData.nationality,
      ...(formData.dniNum && {
        dni: { dniNum: formData.dniNum, expirationDate: formData.dniExpiration },
      }),
      ...(formData.passportNum && {
        passport: { passportNum: formData.passportNum, expirationDate: formData.passportExpiration },
      }),
    };
    onSave(data);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (passenger?.id && onDelete) {
      onDelete(passenger.id);
      onOpenChange(false);
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreateMode ? "Crear Pasajero" : isViewMode ? "Ver Pasajero" : "Editar Pasajero"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información básica */}
          <div className="space-y-3">
            <h4 className="font-medium">Información básica</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="birthDate">Fecha de nacimiento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nationality">Nacionalidad *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  disabled={isViewMode}
                  placeholder="Argentina"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* DNI */}
          <div className="space-y-3">
            <h4 className="font-medium">DNI (opcional)</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="dniNum">Número de DNI</Label>
                <Input
                  id="dniNum"
                  value={formData.dniNum}
                  onChange={(e) => setFormData({ ...formData, dniNum: e.target.value })}
                  disabled={isViewMode}
                  placeholder="12345678"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dniExpiration">Fecha de vencimiento</Label>
                <Input
                  id="dniExpiration"
                  type="date"
                  value={formData.dniExpiration}
                  onChange={(e) => setFormData({ ...formData, dniExpiration: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Pasaporte */}
          <div className="space-y-3">
            <h4 className="font-medium">Pasaporte (opcional)</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="passportNum">Número de pasaporte</Label>
                <Input
                  id="passportNum"
                  value={formData.passportNum}
                  onChange={(e) => setFormData({ ...formData, passportNum: e.target.value })}
                  disabled={isViewMode}
                  placeholder="AAA123456"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="passportExpiration">Fecha de vencimiento</Label>
                <Input
                  id="passportExpiration"
                  type="date"
                  value={formData.passportExpiration}
                  onChange={(e) => setFormData({ ...formData, passportExpiration: e.target.value })}
                  disabled={isViewMode}
                />
              </div>
            </div>
          </div>

          {/* Reservas vinculadas */}
          {!isCreateMode && linkedReservations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Reservas vinculadas</h4>
                <div className="flex flex-wrap gap-2">
                  {linkedReservations.map((reservation) => (
                    <Link key={reservation.id} to={`/reservas/${reservation.id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        {reservation.id}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isCreateMode && !isViewMode && onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isViewMode ? "Cerrar" : "Cancelar"}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.birthDate || !formData.nationality}
              >
                {isCreateMode ? "Crear" : "Guardar cambios"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
