import { useState, useEffect, useTransition, Suspense, useMemo, use } from "react";
import { useNavigate, Outlet, useSearchParams } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { fetchAPI } from "@/lib/api/fetchApi";
import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import type { PaginatedResponse } from "@/lib/interfaces/api.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import type {
  ReservationFilters as Filters,
  ReservationState,
} from "@/lib/interfaces/reservation/reservation.interface";

import { usePassengersStore } from "@/stores/usePassengerStore";
import { Head } from "@/components/seo/Head";
import { cn } from "@/lib/utils/class_value.utils";

const getReservations = (params: { page: number; name?: string; state?: string; dateFrom?: string; dateTo?: string }) => {
  const query = new URLSearchParams();
  query.append("include", "paxReservations,currencyTotals");
  query.append("limit", "20");
  query.append("offset", ((params.page - 1) * 20).toString());

  if (params.name) query.append("passengerName", params.name);
  if (params.state) query.append("state", params.state);
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  return fetchAPI<PaginatedResponse<Reservation>>(`/reservations?${query.toString()}`);
};

export default function ReservasPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { passengers, setPassengers, addPassenger, fetched, setFetched } = usePassengersStore();

  // Mantenemos tus estados originales para compatibilidad con tus funciones
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [isPending, startTransition] = useTransition();

  // 1. LEER VALORES DE LA URL
  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") || undefined;
  const state = searchParams.get("state") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  // 2. PROMESA REACTIVA
  const reservationsPromise = useMemo(() =>
    getReservations({ page, name, state, dateFrom, dateTo }),
    [page, name, state, dateFrom, dateTo]);

  useEffect(() => {
    if (!fetched) {
      startTransition(async () => {
        try {
          const passengersData = await fetchAPI<Pax[]>("/pax");
          setPassengers(passengersData);
          setFetched(true);
        } catch (error) { console.error(error); }
      });
    }
  }, [fetched, setFetched, setPassengers]);

  // 3. HANDLERS DE URL
  const handleFilterChange = (filters: Filters): void => {
    startTransition(() => {
      const newParams = new URLSearchParams();
      if (filters.passengerNames?.[0]) newParams.set("name", filters.passengerNames[0]);
      if (filters.states?.[0]) newParams.set("state", filters.states[0]);
      if (filters.dateFrom) newParams.set("dateFrom", filters.dateFrom.toISOString());
      if (filters.dateTo) newParams.set("dateTo", filters.dateTo.toISOString());
      newParams.set("page", "1");
      setSearchParams(newParams);
      setIsDataLoaded(false); // Forzamos recarga de estados locales
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);
      setIsDataLoaded(false);
    });
  };

  // 4. TUS FUNCIONES ORIGINALES (CRUD)
  const handleCreateReservation = async (data: { state: ReservationState; passengers: Pax[] }) => {
    try {
      const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
      const newRes = await fetchAPI<Reservation>("/reservations", { method: "POST", body: JSON.stringify(body) });

      // Actualizamos estados locales
      setReservations((prev) => [newRes, ...prev]);
      setFilteredReservations((prev) => [newRes, ...prev]);

      // Redirección original
      navigate(`/reservas/${newRes.id}`);
    } catch (e) { console.error(e); }
  };

  const handleDeleteReservation = async (id: string): Promise<void> => {
    if (!confirm("¿Eliminar reserva?")) return;
    startTransition(async () => {
      try {
        await fetchAPI(`/reservations/${id}`, { method: "DELETE" });
        setSearchParams(new URLSearchParams(searchParams));
        setIsDataLoaded(false);
      } catch (error) { console.error(error); }
    });
  };

  const handleEditReservation = (id: string): void => {
    const res = reservations.find((r) => r.id === id);
    if (res) { setSelectedReservation(res); setDialogMode("edit"); setDialogOpen(true); }
  };

  const handleConfirmDialog = async (data: { id?: string; state: ReservationState; passengers: Pax[] }) => {
    try {
      if (dialogMode === "create") {
        await handleCreateReservation({ state: data.state, passengers: data.passengers });
      } else if (dialogMode === "edit" && data.id) {
        const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
        const updated = await fetchAPI<Reservation>(`/reservations/${data.id}`, { method: "PATCH", body: JSON.stringify(body) });
        setReservations((prev) => prev.map((r) => (r.id === data.id ? updated : r)));
        setFilteredReservations((prev) => prev.map((r) => (r.id === data.id ? updated : r)));
        setSearchParams(new URLSearchParams(searchParams)); // Sincronizamos con URL
      }
      setDialogOpen(false);
      setSelectedReservation(null);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <Head title="Reservas" description="Gestión de reservas." />
      <DashboardLayout>
        <div className={cn("space-y-6 w-full transition-opacity", isPending && "opacity-50")}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
              <p className="text-xs text-muted-foreground md:text-sm">Administra todas las reservas</p>
            </div>
            <Button
              onClick={() => { setDialogMode("create"); setDialogOpen(true); }}
              className="h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm cursor-pointer"
              disabled={isPending}
            >
              <Plus className="h-4 w-4" /> Crear Reserva
            </Button>
          </div>

          <ReservationFilters passengers={passengers} onFilterChange={handleFilterChange} />

          <Suspense fallback={<ReservationsTable reservations={[]} isLoading={true} />}>
            <ReservationsContent
              promise={reservationsPromise}
              reservations={reservations}
              filteredReservations={filteredReservations}
              isDataLoaded={isDataLoaded}
              onDataLoad={(data) => {
                setReservations(data);
                setFilteredReservations(data);
                setIsDataLoaded(true);
              }}
              onDelete={handleDeleteReservation}
              onEdit={handleEditReservation}
              onPageChange={handlePageChange}
            />
          </Suspense>
        </div>

        <ReservationDialog
          open={dialogOpen}
          mode={dialogMode}
          onOpenChange={setDialogOpen}
          availablePassengers={passengers}
          reservation={selectedReservation}
          onConfirm={handleConfirmDialog}
          onPassengerCreated={addPassenger}
        />
        <Outlet />
      </DashboardLayout>
    </>
  );
}

function ReservationsContent({
  promise,
  filteredReservations,
  isDataLoaded,
  onDataLoad,
  onDelete,
  onEdit,
  onPageChange
}: {
  promise: Promise<PaginatedResponse<Reservation>>;
  reservations: Reservation[];
  filteredReservations: Reservation[];
  isDataLoaded: boolean;
  onDataLoad: (data: Reservation[]) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPageChange: (page: number) => void;
}) {
  const response = use(promise);

  useEffect(() => {
    if (!isDataLoaded && response.data) {
      onDataLoad(response.data);
    }
  }, [response.data, isDataLoaded, onDataLoad]);

  const displayData = isDataLoaded ? filteredReservations : (response.data ?? []);

  return (
    <div className="space-y-4">
      <ReservationsTable
        reservations={displayData}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      {/* PAGINACIÓN CON META DEL BACKEND */}
      <div className="flex items-center justify-between py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Página {response.meta.page} de {response.meta.totalPages} ({response.meta.total} reservas)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm" className="h-8 text-xs"
            disabled={response.meta.page <= 1}
            onClick={() => onPageChange(response.meta.page - 1)}
          >Anterior</Button>
          <Button
            variant="outline" size="sm" className="h-8 text-xs"
            disabled={!response.meta.hasNext}
            onClick={() => onPageChange(response.meta.page + 1)}
          >Siguiente</Button>
        </div>
      </div>
    </div>
  );
}