import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import PassengerFilters from "@/components/passengers/passenger-filters";
import { PassengersTable } from "@/components/passengers/passengers-table";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Head } from "@/components/seo/Head";
import { Skeleton } from "@/components/ui/skeleton";

// Hooks
import { usePax } from "@/hooks/pax/usePax";
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger"; // Verifica el typo 'Passanger' vs 'Passenger' en tu archivo
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

export default function PasajerosPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1️⃣ Estado UI (Control de Diálogos)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPassenger, setSelectedPassenger] = useState<Pax | undefined>();

  // 2️⃣ Lectura de URL (Single Source of Truth)
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const name = searchParams.get("name") || undefined;
  const nationality = searchParams.get("nationality") || undefined;
  const documentFilter = searchParams.get("documentFilter") || undefined;

  // 3️⃣ Hook de Data (Lectura + Cache + Paginación)
  const { data, isLoading, isPlaceholderData, isError } = usePax({
    page,
    limit,
    name,
    nationality,
    documentFilter,
  });

  // 4️⃣ Hook de Borrado (La tabla necesita esto)
  const { mutate: deletePassenger, isPending: isDeleting, error: deleteError } = useDeletePassenger();

  // 5️⃣ Handlers de UI
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

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    });
  };

  // ✅ Handler simplificado: El Dialog ya guardó y actualizó la caché.
  // Solo necesitamos cerrar el modal.
  const handleDialogSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Head
        title="Pasajeros"
        description="Administra la información de todos los pasajeros registrados en el sistema."
      />
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
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
              disabled={isLoading || isDeleting}
              className="cursor-pointer h-8 gap-2 px-3 text-xs md:h-10 md:px-4 md:text-sm w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Crear Pasajero
            </Button>
          </div>

          {/* Filtros */}
          <PassengerFilters  />

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              Error al conectar con el servidor. Por favor, intente recargar la página.
            </div>
          )}

          {/* Tabla */}
          {data && (
            <>
              <PassengersTable
                passengers={data.data}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                externalError={deleteError ? deleteError.message : undefined}
              />

              {/* Paginación */}
              <div className="flex items-center justify-between py-4 border-t">
                <span className="text-sm text-muted-foreground">
                  Página {data.meta.page} de {data.meta.totalPages} (Total: {data.meta.total})
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || isDeleting}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!data.meta.hasNext || isPlaceholderData || isDeleting}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Autónomo */}
        <PassengerDialog
          key={`${dialogMode}-${selectedPassenger?.id ?? "new"}-${dialogOpen}`}
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedPassenger(undefined);
            setDialogOpen(open);
          }}
          passenger={selectedPassenger}
          mode={dialogMode}
          // 👇 Aquí la magia: ya no pasamos handleSave ni isLoading.
          // Solo escuchamos el éxito para cerrar.
          onSuccess={handleDialogSuccess}
        />
      </DashboardLayout>
    </>
  );
}