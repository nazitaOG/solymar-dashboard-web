import { useState } from "react";
import { useNavigate } from "react-router";
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
import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// --- Interfaces ---
interface PaxReservation {
  pax?: {
    name?: string;
  };
}

interface CurrencyTotal {
  amountPaid?: number;
  currency?: string;
  totalPrice?: number;
}

interface Reservation {
  id: string;
  state: "PENDING" | "CONFIRMED" | "CANCELLED";
  paxReservations?: PaxReservation[];
  currencyTotals?: CurrencyTotal[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface ReservationsTableProps {
  reservations: Reservation[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

/**
 * Normaliza los datos de la reserva para asegurar que las listas existan
 */
const normalizeReservation = (reservation: Reservation): Reservation => {
  return {
    ...reservation,
    paxReservations: reservation.paxReservations ?? [],
    currencyTotals: reservation.currencyTotals ?? [],
  };
};

export function ReservationsTable({
  reservations,
  onEdit,
  onDelete,
  isLoading = false,
}: ReservationsTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // Normalizamos las reservas antes de renderizar
  const safeReservations = reservations.map((r) => normalizeReservation(r));

  // Lógica de paginación
  const totalPages = Math.ceil(safeReservations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReservations = safeReservations.slice(startIndex, endIndex);

  /**
   * Renderiza el Badge de estado con estilos condicionales
   */
  const getStateBadge = (state: Reservation["state"]) => {
    const variants = {
      PENDING: {
        label: "Pendiente",
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      },
      CONFIRMED: {
        label: "Confirmada",
        className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      },
      CANCELLED: {
        label: "Cancelada",
        className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      },
    } as const;

    const config = variants[state];
    return (
      <Badge
        variant="default"
        className={`${config.className} text-[10px] md:text-xs whitespace-nowrap`}
      >
        {config.label}
      </Badge>
    );
  };

  /**
   * Formatea valores numéricos a moneda local
   */
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 w-full">
        <div className="rounded-lg border border-border bg-card overflow-x-auto w-full max-full">
          <Table className="min-w-[600px] md:min-w-[1000px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[100px]">
                  Estado
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[150px]">
                  Pasajeros
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[150px]">
                  Totales
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[120px]">
                  Creada
                </TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[120px]">
                  Actualizada
                </TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs md:text-sm px-2 md:px-4 min-w-[120px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* ✅ MODO LOADING: Mantiene la altura h-24 para consistencia */}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <p className="text-muted-foreground text-xs md:text-sm italic">
                      No se encontraron reservas
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                currentReservations.map((reservation) => (
                  <TableRow
                    key={reservation.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <TableCell
                      className="px-2 md:px-4 cursor-pointer"
                      onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    >
                      {getStateBadge(reservation.state)}
                    </TableCell>

                    <TableCell
                      className="px-2 md:px-4 cursor-pointer"
                      onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    >
                      <div className="flex flex-wrap gap-1">
                        {reservation.paxReservations?.map((pr, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[10px] md:text-xs whitespace-nowrap"
                          >
                            {pr.pax?.name ?? "—"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell
                      className="px-2 md:px-4 whitespace-nowrap cursor-pointer"
                      onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    >
                      <div className="space-y-1">
                        {reservation.currencyTotals?.map((ct, idx) => (
                          <div key={idx} className="text-xs md:text-sm font-medium">
                            {formatCurrency(ct.amountPaid ?? 0, ct.currency ?? "USD")} 
                            <span className="text-muted-foreground font-normal mx-1">/</span>
                            {formatCurrency(ct.totalPrice ?? 0, ct.currency ?? "USD")}
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell 
                      className="text-xs md:text-sm text-muted-foreground whitespace-nowrap px-2 md:px-4 cursor-pointer"
                      onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    >
                      {reservation.createdAt
                        ? format(new Date(reservation.createdAt), "dd MMM yyyy, HH:mm", { locale: es })
                        : "—"}
                    </TableCell>

                    <TableCell 
                      className="text-xs md:text-sm text-muted-foreground whitespace-nowrap px-2 md:px-4 cursor-pointer"
                      onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    >
                      {reservation.updatedAt
                        ? format(new Date(reservation.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })
                        : "—"}
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap px-2 md:px-4">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-7 w-7 md:h-9 md:w-9"
                          onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                        >
                          <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-7 w-7 md:h-9 md:w-9"
                          onClick={() => onEdit?.(reservation.id)}
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer h-7 w-7 md:h-9 md:w-9"
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-rose-500" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente la reserva seleccionada. 
                                Los pasajeros asociados no se borrarán de la base de datos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="cursor-pointer">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                                onClick={() => onDelete?.(reservation.id)}
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
      </div>

      {/* Paginación */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {startIndex + 1} a {Math.min(endIndex, safeReservations.length)} de {safeReservations.length} reservas
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 text-xs md:text-sm cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 text-xs md:text-sm cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}