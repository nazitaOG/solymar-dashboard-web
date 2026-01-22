import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { Reservation, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";

interface ReservationsTableProps {
  reservations: Reservation[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  onView: (id: string) => void;
}

export function ReservationsTable({ 
  reservations, 
  onEdit, 
  onDelete, 
  isLoading = false,
  onView
}: ReservationsTableProps) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);

  const getStateBadge = (state: ReservationState) => {
    const variants: Record<ReservationState, string> = {
      PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      CONFIRMED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      CANCELLED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    };

    const labels: Record<ReservationState, string> = {
      PENDING: "Pendiente",
      CONFIRMED: "Confirmada",
      CANCELLED: "Cancelada",
    };

    return (
      <Badge variant="default" className={`${variants[state]} text-[10px] md:text-xs whitespace-nowrap font-medium`}>
        {labels[state]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 w-full">
        {/* Contenedor con scroll horizontal */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto w-full max-w-full">
          <Table className="min-w-[800px] md:min-w-[1000px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-2 md:px-4 text-xs md:text-sm w-[120px]">Estado</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm">Pasajeros</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm w-[200px]">Totales</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm w-[150px]">Creada</TableHead>
                <TableHead className="px-2 md:px-4 text-right text-xs md:text-sm w-[140px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs md:text-sm italic">
                    No se encontraron reservas
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((res) => (
                  <TableRow 
                    key={res.id} 
                    onClick={() => onView(res.id)}
                    className="hover:bg-accent/50 transition-colors group cursor-pointer"
                  >
                    <TableCell className="px-2 md:px-4">
                      {getStateBadge(res.state)}
                    </TableCell>
                    
                    <TableCell className="px-2 md:px-4">
                      <div className="flex flex-wrap gap-1">
                        {res.paxReservations?.map((pr, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] md:text-xs">
                            {pr.pax?.name ?? "Sin nombre"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="px-2 md:px-4">
                      <div className="space-y-1">
                        {res.currencyTotals?.map((ct, i) => (
                          <div key={i} className="text-xs md:text-sm font-medium whitespace-nowrap">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatCurrency(ct.amountPaid ?? 0, ct.currency ?? "USD")}
                            </span>
                            <span className="text-muted-foreground font-normal mx-1">/</span>
                            <span>{formatCurrency(ct.totalPrice ?? 0, ct.currency ?? "USD")}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell className="px-2 md:px-4 text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                      {res.createdAt ? format(new Date(res.createdAt), "dd MMM yyyy", { locale: es }) : "—"}
                    </TableCell>

                    {/* Acciones con stopPropagation para no disparar el onClick de la fila */}
                    <TableCell className="px-2 md:px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={() => navigate(`./${res.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={() => onEdit?.(res.id)} 
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ id: res.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la reserva permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              onClick={() => {
                if (deleteTarget && onDelete) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}