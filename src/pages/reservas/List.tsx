import { useState, useEffect, useTransition, Suspense, useMemo, use } from "react";
import { useNavigate, Outlet } from "react-router";

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

const getReservations = () =>
  fetchAPI<PaginatedResponse<Reservation>>(
    "/reservations?include=paxReservations,currencyTotals"
  );

export default function ReservasPage() {
  const navigate = useNavigate();
  const { passengers, setPassengers, addPassenger, fetched, setFetched } = usePassengersStore();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // ✅ Flag para control de carga

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [isPending, startTransition] = useTransition();

  const reservationsPromise = useMemo(() => getReservations(), []);

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

  const handleFilterChange = (filters: Filters): void => {
    let filtered = [...reservations];
    if (filters.passengerNames?.length) {
      filtered = filtered.filter((r) =>
        r.paxReservations.some((pr) =>
          filters.passengerNames!.some((name) =>
            pr.pax.name.toLowerCase().includes(name.toLowerCase())
          )
        )
      );
    }
    if (filters.states?.length) filtered = filtered.filter((r) => filters.states!.includes(r.state));
    if (filters.dateFrom) filtered = filtered.filter((r) => new Date(r.createdAt) >= filters.dateFrom!);
    if (filters.dateTo) filtered = filtered.filter((r) => new Date(r.createdAt) <= filters.dateTo!);
    if (filters.currency) {
      filtered = filtered.filter((r) => r.currencyTotals.some((ct) => ct.currency === filters.currency));
    }
    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    setFilteredReservations(filtered);
  };

  const handleCreateReservation = async (data: { state: ReservationState; passengers: Pax[] }) => {
    try {
      const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
      const newRes = await fetchAPI<Reservation>("/reservations", { method: "POST", body: JSON.stringify(body) });
      setReservations((prev) => [newRes, ...prev]);
      setFilteredReservations((prev) => [newRes, ...prev]);
      navigate(`/reservas/${newRes.id}`);
    } catch (e) { console.error(e); }
  };

  const handleDeleteReservation = async (id: string): Promise<void> => {
    const previousReservations = [...reservations];
    const previousFiltered = [...filteredReservations];

    // ✅ Actualización reactiva instantánea
    setReservations((prev) => prev.filter((r) => r.id !== id));
    setFilteredReservations((prev) => prev.filter((r) => r.id !== id));

    startTransition(async () => {
      try {
        await fetchAPI(`/reservations/${id}`, { method: "DELETE" });
      } catch (error) {
        console.error("❌ Error al eliminar:", error);
        setReservations(previousReservations);
        setFilteredReservations(previousFiltered);
        alert("No se pudo eliminar la reserva.");
      }
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
      }
      setDialogOpen(false);
      setSelectedReservation(null);
    } catch (e) { console.error(e); }
  };

  return (
    <>
      <Head title="Reservas" description="Gestión de reservas." />
      <DashboardLayout>
        <div className="space-y-6 w-full">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
              <p className="text-xs text-muted-foreground md:text-sm">Administra todas las reservas</p>
            </div>
            <Button
              onClick={() => { setDialogMode("create"); setDialogOpen(true); }}
              className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
              disabled={isPending}
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Crear Reserva
            </Button>
          </div>

          <ReservationFilters passengers={passengers} onFilterChange={handleFilterChange} />

          <Suspense fallback={<ReservationsTable reservations={[]} isLoading={true} />}>
            <ReservationsContent
              promise={reservationsPromise}
              reservations={reservations} // ✅ Pasamos el estado actual
              filteredReservations={filteredReservations} // ✅ Pasamos el estado filtrado actual
              isDataLoaded={isDataLoaded}
              onDataLoad={(data) => {
                setReservations(data);
                setFilteredReservations(data);
                setIsDataLoaded(true);
              }}
              onDelete={handleDeleteReservation}
              onEdit={handleEditReservation}
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
}: {
  promise: Promise<PaginatedResponse<Reservation>>;
  reservations: Reservation[];
  filteredReservations: Reservation[];
  isDataLoaded: boolean;
  onDataLoad: (data: Reservation[]) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const response = use(promise);
  
  // ✅ Sincronizar solo cuando la promesa termina y el estado local está vacío
  useEffect(() => {
    if (!isDataLoaded && response.data) {
      onDataLoad(response.data);
    }
  }, [response.data, isDataLoaded, onDataLoad]);

  // ✅ IMPORTANTE: Si ya cargamos datos, usamos el estado del padre (reservations/filteredReservations)
  // Si no, usamos lo que viene de la promesa (response.data)
  const displayData = isDataLoaded ? filteredReservations : (response.data ?? []);

  return (
    <ReservationsTable
      reservations={displayData}
      onDelete={onDelete}
      onEdit={onEdit}
    />
  );
}