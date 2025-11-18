import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Users } from "lucide-react";
import { EditPassengersDialog } from "./edit-passengers-dialog";
import { fetchAPI } from "@/lib/api/fetchApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

import type { ReservationDetail, Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

// 🧠 Importamos la store global

interface ReservationDetailHeaderProps {
  reservation: ReservationDetail;
  onStateChange: (state: ReservationState) => void;
  onPassengersChange: (passengers: Pax[]) => void;
}

export function ReservationDetailHeader({
  reservation,
  onStateChange,
  onPassengersChange,
}: ReservationDetailHeaderProps) {
  const [editPassengersOpen, setEditPassengersOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingState, setPendingState] = useState<ReservationState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // 🎨 Estado visual según tipo
  const getStateBadge = (state: ReservationState) => {
    const variants = {
      [ReservationState.PENDING]: {
        label: "Pendiente",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      },
      [ReservationState.CONFIRMED]: {
        label: "Confirmada",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      },
      [ReservationState.CANCELLED]: {
        label: "Cancelada",
        className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      },
    } as const;

    return variants[state];
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const currentPassengers = reservation.paxReservations.map((pr) => pr.pax);

  // 💾 Confirmar cambio de estado
  const handleConfirmStateChange = async (): Promise<void> => {
    if (!pendingState) return;
    try {
      setIsUpdating(true);

      const body: Partial<Pick<Reservation, "state">> & { paxIds?: string[] } = {
        state: pendingState,
        paxIds: currentPassengers.map((p) => p.id),
      };

      const updated = await fetchAPI<Reservation>(`/reservations/${reservation.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      onStateChange(updated.state);

      toast({
        title: "Estado actualizado",
        description: `La reserva ahora está marcada como ${getStateBadge(updated.state).label}.`,
      });
    } catch (error) {
      console.error("❌ Error al actualizar estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la reserva.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setConfirmDialogOpen(false);
      setPendingState(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header con ID y estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-mono">
              {reservation.name}-{String(reservation.code).padStart(5, "0")}
            </h1>


            <Select
              value={reservation.state}
              onValueChange={(value) => {
                const newState = value as ReservationState;
                if (newState !== reservation.state) {
                  setPendingState(newState);
                  setConfirmDialogOpen(true);
                }
              }}
            >
              <SelectTrigger className="w-fit bg-transparent">
                <Badge className={getStateBadge(reservation.state).className}>
                  {getStateBadge(reservation.state).label}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Totales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reservation.currencyTotals.map((ct, idx) => (
            <Card className="w-fit" key={idx}>
              <CardContent className="p-6">
                <div className="w-fit space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{ct.currency}</p>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{formatCurrency(ct.amountPaid, ct.currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      de {formatCurrency(ct.totalPrice, ct.currency)} total
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(ct.amountPaid / ct.totalPrice) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pasajeros */}
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {currentPassengers.map((passenger) => (
              <Badge key={passenger.id} variant="outline" className="gap-2 py-1.5">
                <Users className="h-3 w-3" />
                {passenger.name}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditPassengersOpen(true)}>
            Editar pasajeros
          </Button>
        </div>
      </div>

      {/* ✏️ Diálogo de edición de pasajeros */}
      <EditPassengersDialog
        open={editPassengersOpen}
        onOpenChange={setEditPassengersOpen}
        currentPassengers={currentPassengers}
        onSave={onPassengersChange}
      />

      {/* ⚠️ Confirmación de cambio de estado */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que querés cambiar la reserva de{" "}
              <b>{getStateBadge(reservation.state).label}</b> a{" "}
              <b>{pendingState ? getStateBadge(pendingState).label : ""}</b>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingState(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!pendingState || isUpdating}
              onClick={handleConfirmStateChange}
            >
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
