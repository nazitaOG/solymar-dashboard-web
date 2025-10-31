import { useState } from "react";
import { useNavigate } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import { normalizeReservation } from "@/lib/utils/reservation/normalize_reservation.utils";

interface ReservationsTableProps {
  reservations: Reservation[];
  onEdit?: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function ReservationsTable({ reservations, onEdit }: ReservationsTableProps) {
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
        variant: "default" as const,
        label: "Pendiente",
        className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20",
      },
      CONFIRMED: {
        variant: "default" as const,
        label: "Confirmada",
        className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
      },
      CANCELLED: {
        variant: "default" as const,
        label: "Cancelada",
        className: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20",
      },
    } as const;
    const config = variants[state];
    return (
      <Badge variant={config.variant} className={config.className}>
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
              <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
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
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`./${reservation.id}`, { state: reservation })}
                >
                  <TableCell>{getStateBadge(reservation.state)}</TableCell>

                  {/* ✅ Evita crash si paxReservations está vacío */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(reservation.paxReservations ?? []).map((pr, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {pr.pax?.name ?? "—"}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* ✅ Evita crash si currencyTotals está vacío */}
                  <TableCell>
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

                  <TableCell className="text-sm text-muted-foreground">
                    {reservation.createdAt
                      ? format(new Date(reservation.createdAt), "dd MMM yyyy, HH:mm", { locale: es })
                      : "—"}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {reservation.updatedAt
                      ? format(new Date(reservation.updatedAt), "dd MMM yyyy, HH:mm", { locale: es })
                      : "—"}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`./${reservation.id}`, { state: reservation });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(reservation.id);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
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
