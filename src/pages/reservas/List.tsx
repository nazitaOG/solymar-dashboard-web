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
import type { ReservationFilters as Filters } from "@/lib/interfaces/reservation/reservation.interface";

import { usePassengersStore } from "@/stores/usePassengerStore";
import { Head } from "@/components/seo/Head";
import { cn } from "@/lib/utils/class_value.utils";

// --- SERVICIO DE FETCH ---
const getReservations = (params: { page: number; name?: string; state?: string; dateFrom?: string; dateTo?: string }): Promise<PaginatedResponse<Reservation>> => {
  const query = new URLSearchParams();
  const limit = 20;
  const offset = (params.page - 1) * limit;

  query.append("include", "paxReservations,currencyTotals,hotels,planes,cruises,transfers,excursions,medicalAssists");
  query.append("limit", limit.toString());
  query.append("offset", offset.toString());

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

  const page = Number(searchParams.get("page")) || 1;
  const name = searchParams.get("name") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const [reservationsPromise, setReservationsPromise] = useState<Promise<PaginatedResponse<Reservation>>>(() =>
    getReservations({ page, name, state, dateFrom, dateTo })
  );

  useEffect(() => {
    startTransition(() => {
      setReservationsPromise(getReservations({ page, name, state, dateFrom, dateTo }));
    });
  }, [page, name, state, dateFrom, dateTo]);

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

  const handleConfirmDialog = async (data: { id?: string; state: ReservationState; passengers: Pax[] }) => {
    try {
      const body = { state: data.state, paxIds: data.passengers.map((p) => p.id) };
      if (dialogMode === "create") {
        const newRes = await fetchAPI<Reservation>("/reservations", { method: "POST", body: JSON.stringify(body) });
        navigate(`/reservas/${newRes.id}`);
      } else if (dialogMode === "edit" && data.id) {
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
        <div className={cn("space-y-6 w-full transition-opacity duration-300", isPending && "opacity-50")}>
          
          {/* 1️⃣ HEADER RESPONSIVE (Igual que Pasajeros) */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
              <p className="text-xs text-muted-foreground md:text-sm">Administra todas las reservas</p>
            </div>
            <Button 
              onClick={() => { setSelectedReservation(null); setDialogMode("create"); setDialogOpen(true); }} 
              className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
              disabled={isPending}
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              {isPending ? "Cargando..." : "Crear Reserva"}
            </Button>
          </div>

          <ReservationFilters passengers={passengers} onFilterChange={handleFilterChange} />

          <Suspense fallback={<ReservationsTable reservations={[]} isLoading={true} onView={() => {}} />}>
            <ReservationsContent
              promise={reservationsPromise}
              onDelete={async (id) => {
                if (!confirm("¿Eliminar reserva?")) return;
                await fetchAPI(`/reservations/${id}`, { method: "DELETE" });
                startTransition(() => setReservationsPromise(getReservations({ page, name, state, dateFrom, dateTo })));
              }}
              onEdit={(res) => { setSelectedReservation(res); setDialogMode("edit"); setDialogOpen(true); }}
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

function ReservationsContent({ promise, onDelete, onEdit, onPageChange }: { 
  promise: Promise<PaginatedResponse<Reservation>>; 
  onDelete: (id: string) => void; 
  onEdit: (res: Reservation) => void; 
  onPageChange: (page: number) => void; 
}) {
  const { data, meta } = use(promise);
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <ReservationsTable 
        reservations={data} 
        onDelete={onDelete} 
        onView={(id) => navigate(`/reservas/${id}`)}
        onEdit={(id) => {
          const res = data.find(r => r.id === id);
          if (res) onEdit(res);
        }} 
      />

      {/* 2️⃣ PAGINACIÓN RESPONSIVE (Botones flex-1 en mobile) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
        <p className="text-xs md:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
          Página <strong>{meta.page}</strong> de {meta.totalPages} ({meta.total} resultados)
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={meta.page <= 1} 
            onClick={() => onPageChange(meta.page - 1)} 
            className="flex-1 sm:flex-none cursor-pointer h-8 text-xs md:text-sm"
          >
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={!meta.hasNext} 
            onClick={() => onPageChange(meta.page + 1)} 
            className="flex-1 sm:flex-none cursor-pointer h-8 text-xs md:text-sm"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}