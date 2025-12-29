import { useState, useEffect, useTransition, Suspense } from "react";
import { useNavigate, Outlet } from "react-router";

import { DashboardLayout } from "@/components/entities/layout/dashboard-layout";
import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FullPageLoader } from "@/components/FullPageLoader";

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

export default function ReservasPage() {
  const navigate = useNavigate();

  const { passengers, setPassengers, addPassenger, fetched, setFetched } = usePassengersStore();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const [isPending, startTransition] = useTransition();

  // 🧭 Fetch inicial
  useEffect(() => {
    startTransition(async () => {
      try {
        const reservationsRes = await fetchAPI<PaginatedResponse<Reservation>>(
          "/reservations?include=paxReservations,currencyTotals"
        );
        const reservationsData = reservationsRes.data ?? [];
        setReservations(reservationsData);
        setFilteredReservations(reservationsData);

        if (!fetched) {
          const passengersData = await fetchAPI<Pax[]>("/pax");
          setPassengers(passengersData);
          setFetched(true);
        }
      } catch (error) {
        console.error("❌ Error al obtener datos:", error);
      }
    });
  }, [fetched, setFetched, setPassengers]);

  // 🎛️ Filtros
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

    if (filters.states?.length) {
      filtered = filtered.filter((r) => filters.states!.includes(r.state));
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((r) => new Date(r.createdAt) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter((r) => new Date(r.createdAt) <= filters.dateTo!);
    }

    if (filters.currency) {
      filtered = filtered.filter((r) =>
        r.currencyTotals.some((ct) => ct.currency === filters.currency)
      );
    }

    if (filters.sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    setFilteredReservations(filtered);
  };

  // ➕ Crear reserva
  const handleCreateReservation = async (data: {
    state: ReservationState;
    passengers: Pax[];
  }): Promise<void> => {
    try {
      const body = {
        state: data.state,
        paxIds: data.passengers.map((p) => p.id),
      };

      const newReservation = await fetchAPI<Reservation>("/reservations", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setReservations((prev) => [newReservation, ...prev]);
      setFilteredReservations((prev) => [newReservation, ...prev]);
      navigate(`/reservas/${newReservation.id}`);
    } catch (error) {
      console.error("❌ Error al crear reserva:", error);
    }
  };

  // 🗑️ Eliminar reserva
  const handleDeleteReservation = async (id: string): Promise<void> => {
    try {
      await fetchAPI(`/reservations/${id}`, { method: "DELETE" });
      setReservations((prev) => prev.filter((r) => r.id !== id));
      setFilteredReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("❌ Error al eliminar reserva:", error);
    }
  };

  // ✏️ Editar reserva
  const handleEditReservation = (id: string): void => {
    const res = reservations.find((r) => r.id === id);
    if (!res) return;
    setSelectedReservation(res);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  // 💾 Guardar cambios
  const handleConfirmDialog = async (data: {
    id?: string;
    state: ReservationState;
    passengers: Pax[];
  }): Promise<void> => {
    try {
      if (dialogMode === "create") {
        await handleCreateReservation({
          state: data.state,
          passengers: data.passengers,
        });
      } else if (dialogMode === "edit" && data.id) {
        const body: Partial<Pick<Reservation, "state">> & { paxIds?: string[] } = {
          state: data.state,
          paxIds: data.passengers.map((p) => p.id),
        };

        const updated = await fetchAPI<Reservation>(`/reservations/${data.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });

        setReservations((prev) => prev.map((r) => (r.id === data.id ? updated : r)));
        setFilteredReservations((prev) => prev.map((r) => (r.id === data.id ? updated : r)));
      }

      setDialogOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error("❌ Error al guardar reserva:", error);
    }
  };

  return (
    <>
      <Head
        title="Reservas"
        description="Listado y gestión de todas las reservas de viajes."
      />
      <DashboardLayout>
        <Suspense fallback={<FullPageLoader />}>
          {/* CORRECCIÓN: Eliminado w-[100vw] y pr-6. Ahora es idéntico a PasajerosPage */}
          <div className="space-y-6 w-full">

            {/* Header Responsivo */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reservas</h1>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Administra todas las reservas de viajes
                </p>
              </div>

              <Button
                onClick={() => {
                  setDialogMode("create");
                  setDialogOpen(true);
                }}
                // Clases idénticas a PasajerosPage
                className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {isPending ? "Cargando..." : "Crear Reserva"}
              </Button>
            </div>

            {/* Filtros */}
            <ReservationFilters passengers={passengers} onFilterChange={handleFilterChange} />

            {/* Tabla */}
            <ReservationsTable
              reservations={filteredReservations}
              onDelete={handleDeleteReservation}
              onEdit={handleEditReservation}
            />
          </div>

          {/* Diálogos y Outlet */}
          <ReservationDialog
            open={dialogOpen}
            mode={dialogMode}
            onOpenChange={setDialogOpen}
            availablePassengers={passengers}
            reservation={selectedReservation}
            onConfirm={handleConfirmDialog}
            onPassengerCreated={(newPax) => addPassenger(newPax)}
          />

          <Outlet />
        </Suspense>
      </DashboardLayout>

    </>

  );
}