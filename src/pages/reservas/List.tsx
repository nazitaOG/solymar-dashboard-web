import { useState, useEffect, useTransition, Suspense, use } from "react";
import { useNavigate, Outlet, useSearchParams } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { fetchAPI } from "@/lib/api/fetchApi";
import type { Reservation, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { PaginatedResponse } from "@/lib/interfaces/api.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import type {
  ReservationFilters as Filters,
} from "@/lib/interfaces/reservation/reservation.interface";

import { usePassengersStore } from "@/stores/usePassengerStore";
import { Head } from "@/components/seo/Head";
import { cn } from "@/lib/utils/class_value.utils";

// --- SERVICIO DE FETCH ---
const getReservations = (params: {
  page: number;
  name?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string
}) => {
  const query = new URLSearchParams();
  query.append("include", "paxReservations,currencyTotals,hotels,planes,cruises,transfers,excursions,medicalAssists");
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [isPending, startTransition] = useTransition();

  // 1. LEER VALORES ACTUALES DE LA URL
  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") || undefined;
  const state = searchParams.get("state") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  // 2. PROMESA EN EL STATE (Solución para el refresco instantáneo en React 19)
  const [reservationsPromise, setReservationsPromise] = useState(() =>
    getReservations({ page, name, state, dateFrom, dateTo })
  );

  // Sincronización de pasajeros
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

  // 3. HANDLERS QUE DISPARAN EL RE-FETCH
  const handleFilterChange = (filters: Filters): void => {
    const newParams = new URLSearchParams();
    if (filters.passengerNames?.[0]) newParams.set("name", filters.passengerNames[0]);
    if (filters.states?.[0]) newParams.set("state", filters.states[0]);
    if (filters.dateFrom) newParams.set("dateFrom", filters.dateFrom.toISOString());
    if (filters.dateTo) newParams.set("dateTo", filters.dateTo.toISOString());
    newParams.set("page", "1");

    startTransition(() => {
      setSearchParams(newParams);
      // Forzamos la nueva promesa en el estado
      setReservationsPromise(getReservations({
        page: 1,
        name: filters.passengerNames?.[0],
        state: filters.states?.[0],
        dateFrom: filters.dateFrom?.toISOString(),
        dateTo: filters.dateTo?.toISOString()
      }));
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);

      setReservationsPromise(getReservations({
        page: newPage, name, state, dateFrom, dateTo
      }));
    });
  };

  const handleDeleteReservation = async (id: string): Promise<void> => {
    if (!confirm("¿Eliminar reserva?")) return;
    startTransition(async () => {
      try {
        await fetchAPI(`/reservations/${id}`, { method: "DELETE" });
        setReservationsPromise(getReservations({ page, name, state, dateFrom, dateTo }));
      } catch (error) { console.error(error); }
    });
  };

  const handleEditReservation = (res: Reservation): void => {
    setSelectedReservation(res);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleConfirmDialog = async (data: { id?: string; state: ReservationState; passengers: Pax[] }) => {
    try {
      if (dialogMode === "create") {
        const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
        const newRes = await fetchAPI<Reservation>("/reservations", { method: "POST", body: JSON.stringify(body) });
        navigate(`/reservas/${newRes.id}`);
      } else if (dialogMode === "edit" && data.id) {
        const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
        await fetchAPI<Reservation>(`/reservations/${data.id}`, { method: "PATCH", body: JSON.stringify(body) });

        startTransition(() => {
          setReservationsPromise(getReservations({ page, name, state, dateFrom, dateTo }));
        });
      }
      setDialogOpen(false);
      setSelectedReservation(null);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <Head title="Reservas" description="Gestión de reservas." />
      <DashboardLayout>
        <div className={cn("space-y-6 w-full transition-opacity duration-300", isPending && "opacity-50 pointer-events-none")}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
              <p className="text-xs text-muted-foreground md:text-sm">Administra todas las reservas</p>
            </div>
            <Button
              onClick={() => { setDialogMode("create"); setDialogOpen(true); }}
              className="h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Crear Reserva
            </Button>
          </div>

          <ReservationFilters
            passengers={passengers}
            onFilterChange={handleFilterChange}
          />

          <Suspense fallback={<ReservationsTable reservations={[]} isLoading={true} />}>
            <ReservationsContent
              promise={reservationsPromise}
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
  onDelete,
  onEdit,
  onPageChange,
}: {
  promise: Promise<PaginatedResponse<Reservation>>;
  onDelete: (id: string) => void;
  onEdit: (res: Reservation) => void;
  onPageChange: (page: number) => void;
}) {
  const { data, meta } = use(promise);

  return (
    <div className="space-y-4">
      <ReservationsTable
        reservations={data}
        onDelete={onDelete}
        onEdit={(id) => {
          const res = data.find(r => r.id === id);
          if (res) onEdit(res);
        }}
      />

      <div className="flex items-center justify-between py-4 border-t border-border">
        <p className="text-xs md:text-sm text-muted-foreground">
          Página {meta.page} de {meta.totalPages} ({meta.total} resultados)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
            className="h-8 text-xs cursor-pointer"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNext}
            onClick={() => onPageChange(meta.page + 1)}
            className="h-8 text-xs cursor-pointer"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}