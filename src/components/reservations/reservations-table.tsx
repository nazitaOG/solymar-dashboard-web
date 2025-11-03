import { useState } from "react";
import { useNavigate } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import { normalizeReservation } from "@/lib/utils/reservation/normalize_reservation.utils";

interface ReservationsTableProps {
  reservations: Reservation[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function ReservationsTable({ reservations, onEdit, onDelete }: ReservationsTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Normalizamos todas las reservas antes de renderizarlas
  const safeReservations = reservations.map((r) => normalizeReservation(r));

  const totalPages = Math.ceil(safeReservations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReservations = safeReservations.slice(startIndex, endIndex);

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
      <Badge variant="default" className={config.className}>
        {config.label}
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
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Estado</TableHead>
              <TableHead className="min-w-[150px]">Pasajeros</TableHead>
              <TableHead className="min-w-[150px]">Totales</TableHead>
              <TableHead className="min-w-[150px]">Creada</TableHead>
              <TableHead className="min-w-[150px]">Última actualización</TableHead>
              <TableHead className="text-right min-w-[150px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentReservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <p className="text-muted-foreground text-sm">No se encontraron reservas</p>
                </TableCell>
              </TableRow>
            ) : (
              currentReservations.map((reservation) => (
                <TableRow
                  key={reservation.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  {/* Estado */}
                  <TableCell
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                  >
                    {getStateBadge(reservation.state)}
                  </TableCell>

                  {/* Pasajeros */}
                  <TableCell
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                  >
                    <div className="flex flex-wrap gap-1">
                      {(reservation.paxReservations ?? []).map((pr, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {pr.pax?.name ?? "—"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* Totales */}
                  <TableCell
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                  >
                    <div className="space-y-1">
                      {(reservation.currencyTotals ?? []).map((ct, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">
                            {formatCurrency(ct.amountPaid ?? 0, ct.currency ?? "USD")}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {formatCurrency(ct.totalPrice ?? 0, ct.currency ?? "USD")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Fechas */}
                  <TableCell
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    className="text-sm text-muted-foreground"
                  >
                    {reservation.createdAt
                      ? format(new Date(reservation.createdAt), "dd MMM yyyy, HH:mm", { locale: es })
                      : "—"}
                  </TableCell>

                  <TableCell
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                    className="text-sm text-muted-foreground"
                  >
                    {reservation.updatedAt
                      ? format(new Date(reservation.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })
                      : "—"}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* 👁️ Ver */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`./${reservation.id}`, { state: reservation });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* ✏️ Editar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEdit?.(reservation.id);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* 🗑️ Eliminar con modal */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará permanentemente la reserva y todos sus datos asociados.
                              No podrás deshacer esta acción.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-rose-600 text-white hover:bg-rose-700"
                              onClick={() => {
                                console.log("🧨 Confirmado delete:", reservation.id);
                                onDelete?.(reservation.id);
                              }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {startIndex + 1} a {Math.min(endIndex, safeReservations.length)} de{" "}
            {safeReservations.length} reservas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
