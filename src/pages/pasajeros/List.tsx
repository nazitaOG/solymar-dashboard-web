import { useState, useTransition, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/entities/layout/dashboard-layout";
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
          {/* Header Responsivo */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {/* Título: 2xl en móvil, 3xl en desktop */}
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pasajeros</h1>

              {/* Subtítulo: xs en móvil, sm en desktop */}
              <p className="text-xs text-muted-foreground md:text-sm">
                Administra la información de todos los pasajeros
              </p>
            </div>

            <Button
              onClick={() => {
                setSelectedPassenger(undefined);
                setDialogMode("create");
                setDialogOpen(true);
              }}
              // Botón: h-8/text-xs en móvil | h-10/text-sm en desktop
              className="h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
              disabled={isPending}
            >
              {/* Icono ajustado */}
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
