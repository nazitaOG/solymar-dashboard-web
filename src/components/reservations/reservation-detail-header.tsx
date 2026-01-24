import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Pencil, Users } from "lucide-react";
import { EditPassengersDialog } from "./edit-passengers-dialog";
import { PassengerDialog } from "../passengers/passenger-dialog";
import { fetchAPI } from "@/lib/api/fetchApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  updateReservationNameSchema
} from "@/lib/schemas/reservation/update-reservation-name.schema";

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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

import type { ReservationDetail, Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

// Definición de tipos locales para el componente
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
  onNameChange?: (newName: string) => void;
  paymentItems: FinancialItem[];
}

export function ReservationDetailHeader({
  reservation,
  onStateChange,
  onPassengersChange,
  onNameChange,
  paymentItems,
}: ReservationDetailHeaderProps) {
  const [editPassengersOpen, setEditPassengersOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);

  // 🟢 ESTADOS PARA EL DIALOGO DE PASAJERO INDIVIDUAL (VER)
  const [viewPaxOpen, setViewPaxOpen] = useState(false);
  const [selectedPax, setSelectedPax] = useState<Pax | undefined>();

  // Estados manuales para el formulario de nombre
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  const [pendingState, setPendingState] = useState<ReservationState | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editNameOpen) {
      setTempName(reservation.name || "");
      setNameError(null);
    }
  }, [editNameOpen, reservation.name]);

  const handleSaveName = async () => {
    const result = updateReservationNameSchema.safeParse({ name: tempName });

    if (!result.success) {
      const error = result.error.issues.find((issue) => issue.path[0] === "name");
      setNameError(error?.message || "Error en el nombre");
      return;
    }

    try {
      setIsSavingName(true);
      await fetchAPI<Reservation>(`/reservations/${reservation.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: result.data.name }),
      });

      if (onNameChange) {
        onNameChange(result.data.name);
      }

      toast({ title: "Nombre actualizado correctamente" });
      setEditNameOpen(false);
    } catch (error) {
      console.error("Error updating name:", error);
      toast({ title: "Error al actualizar el nombre", variant: "destructive" });
    } finally {
      setIsSavingName(false);
    }
  };

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

  // 🟢 HANDLER PARA VER PASAJERO
  const handleViewPassenger = (pax: Pax) => {
    setSelectedPax(pax);
    setViewPaxOpen(true);
  };

  return (
    <>
      <div className="pl-4 pr-3 md:pl-0 w-full">
        {/* --- Header principal --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="flex flex-row flex-wrap items-start gap-4 w-full sm:w-auto">

            {/* Título y Lápiz */}
            <div className="flex items-baseline gap-2 group w-fit sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono break-all sm:break-normal">
                {reservation.name}-{String(reservation.code).padStart(5, "0")}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => setEditNameOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            {/* Selector de Estado */}
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
              <SelectTrigger className="w-fit cursor-pointer bg-transparent">
                <Badge className={getStateBadge(reservation.state).className}>
                  {getStateBadge(reservation.state).label}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING" className="cursor-pointer">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED" className="cursor-pointer">Confirmada</SelectItem>
                <SelectItem value="CANCELLED" className="cursor-pointer">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* --- Sección de Totales y Link --- */}
        <div className="flex flex-col w-full pr-1 sm:w-full items-center sm:items-start gap-2">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-2 w-full sm:w-full">

            {/* Cards de Moneda */}
            <div className="flex w-full flex-col pt-5 sm:flex-row sm:flex-wrap gap-4 items-center sm:items-start">
              {reservation.currencyTotals.map((ct, idx) => (
                <Card className=" sm:w-fit w-full shadow-sm px-4" key={idx}>
                  <CardContent className="p-2 sm:p-6">
                    <div className="w-full space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{ct.currency}</p>
                      <div className="space-y-1">
                        <p className="text-2xl sm:text-3xl font-bold truncate">
                          {formatCurrency(ct.amountPaid, ct.currency)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
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
          </div>
          {paymentItems.length > 0 && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPaymentDetailsOpen(true);
              }}
              className={`text-sm self-start pb-3 pl-1 font-medium flex items-center gap-1.5 transition-all mt-2 sm:mt-0 whitespace-nowrap mb-1 hover:underline text-red-500 hover:text-red-600 dark:text-red-400/70 dark:hover:text-red-400`}
            >
              <AlertCircle className="h-4 w-4" />
              ¿Qué falta pagar?
            </a>
          )}
        </div>

        {/* --- Sección de Pasajeros (ACTUALIZADA) --- */}
        <div className="flex flex-col h-fit justify-between sm:flex-row items-start sm:items-center w-full gap-4">
          <div className="flex gap-2 flex-wrap w-full sm:w-auto sm:flex-1">
            {currentPassengers.map((passenger) => (
              <Badge
                key={passenger.id}
                variant="outline"
                // 🟢 AHORA SON CLICKEABLES
                className="gap-2 py-1.5 px-3 max-w-full cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleViewPassenger(passenger)}
              >
                <Users className="md:!h-4 md:!w-4 text-muted-foreground shrink-0" />
                <span className="truncate text-xs md:text-sm">{passenger.name}</span>
              </Badge>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setEditPassengersOpen(true)}
            className="cursor-pointer w-full sm:w-auto h-8 px-3 md:text-sm text-xs shrink-0"
          >
            Editar pasajeros
          </Button>
        </div>
      </div>

      {/* --- DIALOGOS --- */}

      {/* 🟢 NUEVO DIALOGO PARA VER PASAJERO */}
      {viewPaxOpen && (
        <PassengerDialog
          open={viewPaxOpen}
          onOpenChange={setViewPaxOpen}
          passenger={selectedPax}
          mode="view" // Solo lectura
        />
      )}

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
            <AlertDialogCancel className="cursor-pointer" onClick={() => setPendingState(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              disabled={!pendingState || isUpdating}
              onClick={handleConfirmStateChange}
            >
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer">
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

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
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

      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle>Editar nombre de la reserva</DialogTitle>
            <DialogDescription>
              Cambia el nombre descriptivo de la reserva.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: Viaje a Disney 2024"
                value={tempName}
                onChange={(e) => {
                  setTempName(e.target.value);
                  if (nameError) setNameError(null);
                }}
              />
              {nameError && (
                <p className="text-sm text-red-500 font-medium">
                  {nameError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setEditNameOpen(false)}>
              Cancelar
            </Button>
            <Button className="cursor-pointer" onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </>
  );
}