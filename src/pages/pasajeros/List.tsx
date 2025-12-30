import { useState, useTransition, useEffect, Suspense, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PassengerFilters } from "@/components/passengers/passenger-filters";
import { PassengersTable } from "@/components/passengers/passengers-table";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { FullPageLoader } from "@/components/FullPageLoader";
import { usePassengersStore } from "@/stores/usePassengerStore";
import { Head } from "@/components/seo/Head";
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger";

// Definimos el tipo de los filtros para evitar el 'any'
interface FilterCriteria {
  search: string;
  nationality?: string;
  documentFilter?: string;
}

export default function PasajerosPage() {
  // 1️⃣ Estados para el control del Diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create",
  );
  const [selectedPassenger, setSelectedPassenger] = useState<Pax | undefined>();

  // 2️⃣ Estado para los Filtros
  const [filters, setFilters] = useState<FilterCriteria>({
    search: "",
    nationality: undefined,
    documentFilter: undefined,
  });

  const [isPending, startTransition] = useTransition();

  // 3️⃣ Hooks del Store global
  const {
    passengers,
    fetchPassengers,
    refreshPassengers,
    addPassenger,
    updatePassenger,
    removePassenger,
    loading,
  } = usePassengersStore();

  // 4️⃣ Hook de eliminación
  const { deletePassenger, error: deleteError } = useDeletePassenger({
    onDeleteSuccess: (id) => {
      removePassenger(id);
    },
  });

  // 🧭 Sincronización Inicial con el Servidor
  useEffect(() => {
    startTransition(() => {
      fetchPassengers();
    });
  }, [fetchPassengers]);

  // 🚀 Lógica de Filtrado DERIVADA
  const filteredPassengers = useMemo(() => {
    let result = [...passengers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.dni?.dniNum.toLowerCase().includes(searchLower) ||
          p.passport?.passportNum.toLowerCase().includes(searchLower),
      );
    }

    if (filters.nationality) {
      result = result.filter((p) => p.nationality === filters.nationality);
    }

    if (filters.documentFilter === "with-dni") {
      result = result.filter((p) => !!p.dni);
    } else if (filters.documentFilter === "with-passport") {
      result = result.filter((p) => !!p.passport);
    } else if (filters.documentFilter === "with-any-document") {
      result = result.filter((p) => !!p.dni || !!p.passport);
    }

    return result;
  }, [passengers, filters]);

  /**
   * Manejadores de Interfaz
   */
  const handleFilterChange = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
  };

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

  const handleDelete = (id: string) => {
    deletePassenger(id);
  };

  const handleSave = (savedPassenger: Pax) => {
    if (dialogMode === "create") {
      addPassenger(savedPassenger);
    } else if (dialogMode === "edit") {
      updatePassenger(savedPassenger);
    }
    refreshPassengers();
  };

  return (
    <>
      <Head
        title="Pasajeros"
        description="Administra la información de todos los pasajeros registrados en el sistema."
      />
      <DashboardLayout>
        <Suspense fallback={<FullPageLoader />}>
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Pasajeros
                </h1>
                <p className="text-xs text-muted-foreground md:text-sm">
                  Lista de pasajeros registrados y gestión de documentos.
                </p>
              </div>

              <Button
                onClick={() => {
                  setSelectedPassenger(undefined);
                  setDialogMode("create");
                  setDialogOpen(true);
                }}
                className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {isPending ? "Sincronizando..." : "Crear Pasajero"}
              </Button>
            </div>

            {/* Tipamos la función de cambio de filtros correctamente */}
            <PassengerFilters
              onFilterChange={(f) => handleFilterChange(f as FilterCriteria)}
            />

            <PassengersTable
              passengers={filteredPassengers}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={loading}
              externalError={deleteError}
            />
          </div>

          <PassengerDialog
            key={`${dialogMode}-${selectedPassenger?.id ?? "new"}-${dialogOpen}`}
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!open) setSelectedPassenger(undefined);
              setDialogOpen(open);
            }}
            passenger={selectedPassenger}
            mode={dialogMode}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </Suspense>
      </DashboardLayout>
    </>
  );
}
