import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
// import { ScrollArea } from "@/components/ui/scroll-area"; // 🗑️ Lo quitamos para usar scroll nativo más seguro

import type { ReservationDetail, Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

export interface FinancialItem {
  id: string;
  type: string;
  label: string;
  totalPrice: number;
  amountPaid: number;
  currency: string;
}

interface ReservationDetailHeaderProps {
  reservation: ReservationDetail;
  onStateChange: (state: ReservationState) => void;
  onPassengersChange: (passengers: Pax[]) => void;
  paymentItems: FinancialItem[];
}

export function ReservationDetailHeader({
  reservation,
  onStateChange,
  onPassengersChange,
  paymentItems,
}: ReservationDetailHeaderProps) {
  const [editPassengersOpen, setEditPassengersOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [pendingState, setPendingState] = useState<ReservationState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "ARS") {
      const number = new Intl.NumberFormat("es-AR", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount);
      return `AR$ ${number}`;
    }
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalsByCurrency = useMemo(() => {
    const acc: Record<string, { total: number; paid: number; missing: number }> = {};
    
    paymentItems.forEach(item => {
      const curr = item.currency;
      if (!acc[curr]) {
        acc[curr] = { total: 0, paid: 0, missing: 0 };
      }
      acc[curr].total += item.totalPrice;
      acc[curr].paid += item.amountPaid;
    });

    Object.keys(acc).forEach(key => {
        acc[key].missing = acc[key].total - acc[key].paid;
    });

    return acc;
  }, [paymentItems]);

  const currentPassengers = reservation.paxReservations.map((pr) => pr.pax);

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

        <div className="flex flex-col w-fit sm:flex-row items-start sm:items-end gap-2">
          <div className="flex flex-wrap gap-4 w-fit">
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

           <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPaymentDetailsOpen(true);
            }}
            className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5 transition-colors mb-1"
          >
            <AlertCircle className="h-4 w-4" />
            ¿Qué falta pagar?
          </a>
        </div>

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

      <EditPassengersDialog
        open={editPassengersOpen}
        onOpenChange={setEditPassengersOpen}
        currentPassengers={currentPassengers}
        onSave={onPassengersChange}
      />

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

      {/* 💰 Dialog de Detalles de Pago (CORREGIDO FINAL) */}
      <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* Header fijo (con padding propio) */}
          <div className="px-6 pt-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Detalle de Saldos
              </DialogTitle>
              <DialogDescription>
                Desglose de items pendientes y pagados.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Body scrolleable: 
            - 'flex-1': Toma todo el espacio restante disponible.
            - 'overflow-y-auto': Habilita el scroll nativo cuando el contenido excede la altura.
            - 'min-h-0': Crucial en flexbox anidados para permitir que el scroll funcione.
          */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                
                {/* 1. Resumen General */}
                {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                    <div key={currency} className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm border border-border/50">
                        <div className="flex justify-between items-center mb-1">
                            <Badge variant="outline" className="bg-background">{currency}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total del plan:</span>
                            <span className="font-medium">{formatCurrency(totals.total, currency)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                            <span>Pagado:</span>
                            <span className="font-bold">{formatCurrency(totals.paid, currency)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 border-t pt-2 mt-2 border-border/50">
                            <span className="font-bold">Falta pagar:</span>
                            <span className="font-bold">{formatCurrency(totals.missing, currency)}</span>
                        </div>
                    </div>
                ))}

                {/* 2. Lista de Items */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium leading-none">Desglose de items</h4>
                    {paymentItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No hay servicios cargados en esta reserva.</p>
                    ) : (
                        <ul className="grid gap-2">
                            {paymentItems.map((item) => {
                                const missing = item.totalPrice - item.amountPaid;
                                const isMissing = missing > 0.01; 

                                return (
                                    <li key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border ${isMissing ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' : 'bg-transparent border-transparent opacity-70'}`}>
                                        <div className="flex items-start gap-2 mb-2 sm:mb-0">
                                            {isMissing ? (
                                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className={`text-sm ${isMissing ? 'font-medium text-red-900 dark:text-red-200' : 'text-muted-foreground'}`}>
                                                    {item.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground/70">
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-0.5 pl-6 sm:pl-0">
                                            {isMissing ? (
                                                <>
                                                    <span className="text-xs text-muted-foreground">
                                                        Faltan:
                                                    </span>
                                                    <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
                                                        {formatCurrency(missing, item.currency)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                                    Pagado
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}