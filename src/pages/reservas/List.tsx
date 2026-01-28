import { useState } from "react";
import { useNavigate, Outlet, useSearchParams } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

// Hooks
import { useReservations } from "@/hooks/reservations/useReservations";
import { useReservationMutations } from "@/hooks/reservations/useReservationMutation";
import { usePaxSelect } from "@/hooks/pax/usePaxSelect"; // 👈 Hook con memoria (Store replacement)
import { Head } from "@/components/seo/Head";
import { cn } from "@/lib/utils/class_value.utils";

import type { Reservation, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import type { ReservationFilters as Filters } from "@/lib/interfaces/reservation/reservation.interface";

export default function ReservasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1️⃣ Estado UI (Control de Diálogos)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 2️⃣ Params de URL (Lectura)
  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  // 3️⃣ Data Fetching (Reservas - Paginado, siempre fresco)
  const { data: reservationsData, isLoading, isFetching } = useReservations({
    page, name, state, dateFrom, dateTo
  });

  // 4️⃣ Data Fetching (Pasajeros - Memoria tipo Store)
  // Se carga la primera vez y no vuelve a pedir datos a menos que se cree/edite un pax.
  const { data: availablePassengers = [] } = usePaxSelect();

  // 5️⃣ Mutaciones (Escritura)
  const { createReservation, updateReservation, deleteReservation } = useReservationMutations();

  // Handlers de filtros y paginación
  const handleFilterChange = (filters: Filters): void => {
    const newParams = new URLSearchParams();
    if (filters.passengerNames?.[0]) newParams.set("name", filters.passengerNames[0]);
    if (filters.states?.[0]) newParams.set("state", filters.states[0]);
    if (filters.dateFrom) newParams.set("dateFrom", filters.dateFrom.toISOString());
    if (filters.dateTo) newParams.set("dateTo", filters.dateTo.toISOString());
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number): void => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  // 🔥 Confirmación del Diálogo usando Mutaciones
  const handleConfirmDialog = (data: { id?: string; state: ReservationState; passengers: Pax[] }) => {
    const payload = { state: data.state, paxIds: data.passengers.map((p) => p.id) };

    if (dialogMode === "create") {
      createReservation.mutate(payload, {
        onSuccess: (newRes) => {
          setDialogOpen(false);
          navigate(`/reservas/${newRes.id}`);
        }
      });
    } else if (dialogMode === "edit" && data.id) {
      updateReservation.mutate({ id: data.id, payload }, {
        onSuccess: () => {
          setDialogOpen(false);
          setSelectedReservation(null);
        }
      });
    }
  };

  const handleDeleteReservation = (id: string) => {
    deleteReservation.mutate(id);
  };

  // ✅ Callback para cuando se crea un pasajero desde el ReservationDialog.
  // No necesitamos hacer nada manual porque el hook useCreatePax ya invalidó la query "pax".
  // TanStack Query actualizará "availablePassengers" automáticamente.
  const handlePassengerCreated = () => {
    // Lógica opcional si quisieras seleccionarlo automáticamente en el form
    // Pero la actualización de datos es automática.
  };

  // Estado de carga global para botones
  const isMutating = createReservation.isPending || updateReservation.isPending || deleteReservation.isPending;

  return (
    <>
      <Head title="Reservas" description="Gestión de reservas." />
      <DashboardLayout>
        <div className={cn("space-y-6 w-full transition-opacity duration-300", (isFetching || isMutating) && "opacity-60")}>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
              <p className="text-xs text-muted-foreground md:text-sm">Administra todas las reservas</p>
            </div>
            <Button
              onClick={() => { setSelectedReservation(null); setDialogMode("create"); setDialogOpen(true); }}
              className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
              disabled={isLoading || isFetching || isMutating}
            >
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              {isFetching ? "Cargando..." : "Crear Reserva"}
            </Button>
          </div>

          <ReservationFilters
            // Pasamos la lista "cacheada"
            passengers={availablePassengers}
            onFilterChange={handleFilterChange}
          />

          <ReservationsTable
            reservations={reservationsData?.data ?? []}
            isLoading={isLoading}
            onDelete={handleDeleteReservation}
            onView={(id) => navigate(`/reservas/${id}`)}
            onEdit={(id) => {
              const res = reservationsData?.data.find(r => r.id === id);
              if (res) { setSelectedReservation(res); setDialogMode("edit"); setDialogOpen(true); }
            }}
          />

          {reservationsData && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
              <p className="text-xs md:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                Página <strong>{reservationsData.meta.page}</strong> de {reservationsData.meta.totalPages} ({reservationsData.meta.total} resultados)
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reservationsData.meta.page <= 1 || isFetching}
                  onClick={() => handlePageChange(reservationsData.meta.page - 1)}
                  className="flex-1 sm:flex-none h-8 text-xs md:text-sm cursor-pointer"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!reservationsData.meta.hasNext || isFetching}
                  onClick={() => handlePageChange(reservationsData.meta.page + 1)}
                  className="flex-1 sm:flex-none h-8 text-xs md:text-sm cursor-pointer"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        <ReservationDialog
          open={dialogOpen}
          mode={dialogMode}
          onOpenChange={setDialogOpen}
          availablePassengers={availablePassengers}
          reservation={selectedReservation}
          isPending={isMutating}
          onConfirm={handleConfirmDialog}
          // Pasamos el handler simplificado
          onPassengerCreated={handlePassengerCreated}
        />
        <Outlet />
      </DashboardLayout>
    </>
  );
}