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
  AlertDialogTrigger,
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

// Importamos tus interfaces reales
import type { Reservation, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";

interface ReservationsTableProps {
  reservations: Reservation[]; // Ya no hay any
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function ReservationsTable({ 
  reservations, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: ReservationsTableProps) {
  const navigate = useNavigate();

  // Tipamos el objeto de variantes para evitar el any
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
      <Badge variant="default" className={`${variants[state]} text-[10px] md:text-xs whitespace-nowrap`}>
        {labels[state]}
      </Badge>
    );
  };

  /**
   * Formatea valores numéricos a moneda local (con tipado estricto)
   */
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table className="min-w-[1000px] w-full">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs md:text-sm">Estado</TableHead>
            <TableHead className="text-xs md:text-sm">Pasajeros</TableHead>
            <TableHead className="text-xs md:text-sm">Totales</TableHead>
            <TableHead className="text-xs md:text-sm">Creada</TableHead>
            <TableHead className="text-right text-xs md:text-sm">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24">
                <div className="flex justify-center items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground">Cargando reservas...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : reservations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <p className="text-muted-foreground text-xs md:text-sm italic">
                  No se encontraron reservas
                </p>
              </TableCell>
            </TableRow>
          ) : (
            reservations.map((res) => (
              <TableRow 
                key={res.id} 
                className="hover:bg-accent/50 transition-colors group"
              >
                <TableCell onClick={() => navigate(`./${res.id}`)} className="cursor-pointer">
                  {getStateBadge(res.state)}
                </TableCell>
                
                <TableCell onClick={() => navigate(`./${res.id}`)} className="cursor-pointer">
                  <div className="flex flex-wrap gap-1">
                    {res.paxReservations?.map((pr, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] md:text-xs">
                        {pr.pax?.name ?? "Sin nombre"}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell onClick={() => navigate(`./${res.id}`)} className="cursor-pointer">
                  <div className="space-y-1">
                    {res.currencyTotals?.map((ct, i) => (
                      <div key={i} className="text-xs md:text-sm font-medium whitespace-nowrap">
                        {formatCurrency(ct.amountPaid ?? 0, ct.currency ?? "USD")}
                        <span className="text-muted-foreground font-normal mx-1">/</span>
                        {formatCurrency(ct.totalPrice ?? 0, ct.currency ?? "USD")}
                      </div>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  {res.createdAt ? format(new Date(res.createdAt), "dd MMM yyyy", { locale: es }) : "—"}
                </TableCell>

                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1 md:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => navigate(`./${res.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => onEdit?.(res.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </AlertDialogTrigger>
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
                            onClick={() => onDelete?.(res.id)}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}