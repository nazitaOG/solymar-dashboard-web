import { useState, useTransition, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PassengerFilters } from "@/components/passengers/passenger-filters";
import { PassengersTable } from "@/components/passengers/passengers-table";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockReservations } from "@/lib/mock-data";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { FullPageLoader } from "@/components/FullPageLoader";
import { usePassengersStore } from "@/stores/usePassengerStore";

export default function PasajerosPage() {
  const [filteredPassengers, setFilteredPassengers] = useState<Pax[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPassenger, setSelectedPassenger] = useState<Pax | undefined>();
  const [isPending, startTransition] = useTransition();

  // ✅ Estado global del store
  const {
    passengers,
    fetched,
    fetchPassengers,
    addPassenger,
    removePassenger,
  } = usePassengersStore();

  // 🧭 Fetch inicial — solo si aún no se hizo
  useEffect(() => {
    if (!fetched) {
      startTransition(() => {
        fetchPassengers();
      });
    }
  }, [fetched, fetchPassengers]);

  // 🔁 Mantener la lista filtrada sincronizada
  useEffect(() => {
    setFilteredPassengers(passengers);
  }, [passengers]);

  // 🔍 Filtros
  const handleFilterChange = (filters: {
    search: string;
    nationality?: string;
    documentFilter?: string;
  }) => {
    let filtered = [...passengers];

    if (filters.search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.nationality) {
      filtered = filtered.filter((p) => p.nationality === filters.nationality);
    }
    if (filters.documentFilter === "with-dni") {
      filtered = filtered.filter((p) => p.dni);
    } else if (filters.documentFilter === "with-passport") {
      filtered = filtered.filter((p) => p.passport);
    } else if (filters.documentFilter === "with-any-document") {
      filtered = filtered.filter((p) => !!p.dni || !!p.passport);
    }

    setFilteredPassengers(filtered);
  };

  // 🧩 Crear / Editar / Ver
  const handleView = (passenger: Pax) => {
    setDialogMode("view");
    setSelectedPassenger(passenger);
    setDialogOpen(true);
  };

  const handleEdit = (passenger: Pax) => {
    setDialogMode("edit");
    setSelectedPassenger(passenger);
    setDialogOpen(true);
  };

  // 💾 Guardar pasajero (crear o editar)
  const handleSave = (newPassenger: Pax) => {
    if (dialogMode === "create") {
      addPassenger(newPassenger);
    } else if (dialogMode === "edit") {
      // si querés, podés agregar un updatePassenger al store más adelante
      removePassenger(newPassenger.id);
      addPassenger(newPassenger);
    }
  };

  // 🗑️ Eliminar pasajero
  const handleDelete = (id: string) => {
    removePassenger(id);
  };

  const linkedReservations = selectedPassenger
    ? mockReservations
        .filter((r) =>
          r.paxReservations.some((pr: { pax: Pax }) => pr.pax.id === selectedPassenger.id)
        )
        .map((r) => ({ id: r.id, state: r.state }))
    : [];

  return (
    <DashboardLayout>
      <Suspense fallback={<FullPageLoader />}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pasajeros</h1>
              <p className="text-muted-foreground">
                Administra la información de todos los pasajeros
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedPassenger(undefined);
                setDialogMode("create");
                setDialogOpen(true);
              }}
              className="gap-2"
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
              {isPending ? "Cargando..." : "Crear Pasajero"}
            </Button>
          </div>

          {/* Filtros */}
          <PassengerFilters onFilterChange={handleFilterChange} />

          {/* Tabla */}
          <PassengersTable
            passengers={filteredPassengers}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Diálogo */}
        <PassengerDialog
          key={`${dialogMode}-${selectedPassenger?.id ?? "new"}`}
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPassenger(undefined);
              setDialogMode("create");
            }
            setDialogOpen(open);
          }}
          passenger={selectedPassenger}
          mode={dialogMode}
          linkedReservations={linkedReservations}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </Suspense>
    </DashboardLayout>
  );
}
