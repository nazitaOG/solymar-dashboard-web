import { useState, useTransition, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PassengerFilters } from "@/components/passengers/passenger-filters";
import { PassengersTable } from "@/components/passengers/passengers-table";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { FullPageLoader } from "@/components/FullPageLoader";
import { usePassengersStore } from "@/stores/usePassengerStore";
import { Head } from "@/components/seo/Head";
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger";

export default function PasajerosPage() {
  const [filteredPassengers, setFilteredPassengers] = useState<Pax[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPassenger, setSelectedPassenger] = useState<Pax | undefined>();
  
  const [isPending, startTransition] = useTransition();

  const {
    passengers,
    fetchPassengers,
    refreshPassengers,
    addPassenger,
    updatePassenger,
    removePassenger,
  } = usePassengersStore();

  const { deletePassenger, error: deleteError } = useDeletePassenger({
    onDeleteSuccess: (id) => {
      removePassenger(id);
    }
  });

  useEffect(() => {
    startTransition(() => {
      fetchPassengers();
    });
  }, [fetchPassengers]);

  useEffect(() => {
    setFilteredPassengers(passengers);
  }, [passengers]);

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
      filtered = filtered.filter((p) => !!p.dni);
    } else if (filters.documentFilter === "with-passport") {
      filtered = filtered.filter((p) => !!p.passport);
    } else if (filters.documentFilter === "with-any-document") {
      filtered = filtered.filter((p) => !!p.dni || !!p.passport);
    }
    setFilteredPassengers(filtered);
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
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pasajeros</h1>
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

            <PassengerFilters onFilterChange={handleFilterChange} />

            <PassengersTable
              passengers={filteredPassengers}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Banner de Error estático con animación de entrada */}
            {deleteError && (
              <div className="mt-4 p-4 rounded-lg border border-destructive bg-destructive/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm font-bold text-destructive">
                  {deleteError}
                </p>
              </div>
            )}
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