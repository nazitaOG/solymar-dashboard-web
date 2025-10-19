import { useState } from "react";
import { useNavigate } from "react-router";

import { DashboardLayout } from "@/components/layout/dashboard-layout"; // ✅ export nombrado

import { ReservationFilters } from "@/components/reservations/reservation-filters";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { CreateReservationDialog } from "@/components/reservations/create-reservation-dialog";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { mockReservations, mockPassengers } from "@/lib/mock-data";
import type {
  Reservation,
  ReservationFilters as Filters,
  ReservationState,
  Pax,
} from "@/lib/types";

import { Outlet } from "react-router";

export default function ReservasPage() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(mockReservations);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleFilterChange = (filters: Filters) => {
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
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filters.sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    setFilteredReservations(filtered);
  };


  const handleCreateReservation = (data: { state: ReservationState; passengers: Pax[] }) => {
    const newReservation: Reservation = {
      id: `RSV-${String(reservations.length + 1).padStart(3, "0")}`,
      userId: "user-new",
      state: data.state,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "admin@solymar.com",
      updatedBy: "admin@solymar.com",
      currencyTotals: [],
      paxReservations: data.passengers.map((pax) => ({ pax })),
    };

    setReservations([newReservation, ...reservations]);
    setFilteredReservations([newReservation, ...filteredReservations]);
    navigate(`/reservas/${newReservation.id}`);
  };

  return (
    // ❌ NO pasamos topbar/sidebar como props
    // ✅ usamos onCreateReservation para el botón del Topbar
    <DashboardLayout onCreateReservation={() => setCreateDialogOpen(true)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
            <p className="text-muted-foreground">Administra todas las reservas de viajes</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Reserva
          </Button>
        </div>

        <ReservationFilters passengers={mockPassengers} onFilterChange={handleFilterChange} />

        {/* Si tu tabla ya navega "por dentro", podés quitar onRowClick */}
        <ReservationsTable reservations={filteredReservations} />
      </div>

      <CreateReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        availablePassengers={mockPassengers}
        onCreate={handleCreateReservation}
      />
      <Outlet />
    </DashboardLayout>
  );
}
