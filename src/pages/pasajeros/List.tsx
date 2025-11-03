import { useState, useTransition, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PassengerFilters } from "@/components/passengers/passenger-filters";
import { PassengersTable } from "@/components/passengers/passengers-table";
import { PassengerDialog } from "@/components/passengers/passenger-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockReservations } from "@/lib/mock-data";
import { fetchAPI } from "@/lib/api/fetchApi"
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { FullPageLoader } from "@/components/FullPageLoader";

export default function PasajerosPage() {
  const [passengers, setPassengers] = useState<Pax[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<Pax[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedPassenger, setSelectedPassenger] = useState<Pax | undefined>();
  const [isPending, startTransition] = useTransition();

  // Fetch inicial de pasajeros
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchAPI<Pax[]>("/pax")
        setPassengers(data)
        setFilteredPassengers(data)
      } catch (error) {
        console.error("Error fetching passengers:", error)
      }
    })
  }, [])

  // Filtros
  const handleFilterChange = (filters: { search: string; nationality?: string; documentFilter?: string }) => {
    let filtered = [...passengers];

    if (filters.search) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(filters.search.toLowerCase()));
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

  // Crear / Ver / Editar

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

  const handleSave = (passengerData: Partial<Pax>) => {
    if (dialogMode === "create") {
      const newPassenger: Pax = {
        id: `pax-${Date.now()}`,
        name: passengerData.name!,
        birthDate: passengerData.birthDate!,
        nationality: passengerData.nationality!,
        ...(passengerData.dni && { dni: passengerData.dni }),
        ...(passengerData.passport && { passport: passengerData.passport }),
      };
      setPassengers((prev) => [...prev, newPassenger]);
      setFilteredPassengers((prev) => [...prev, newPassenger]);
    } else if (dialogMode === "edit" && selectedPassenger) {
      const updated = passengers.map((p) => (p.id === selectedPassenger.id ? { ...p, ...passengerData } : p));
      setPassengers(updated);
      setFilteredPassengers(updated.filter((p) => filteredPassengers.find((fp) => fp.id === p.id)));
    }
  };

  const handleDelete = (id: string) => {
    const updated = passengers.filter((p) => p.id !== id);
    setPassengers(updated);
    setFilteredPassengers(updated.filter((p) => filteredPassengers.find((fp) => fp.id === p.id)));
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pasajeros</h1>
              <p className="text-muted-foreground">Administra la información de todos los pasajeros</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2" disabled={isPending}>
              <Plus className="h-4 w-4" />
              {isPending ? "Cargando..." : "Crear Pasajero"}
            </Button>
          </div>

          <PassengerFilters onFilterChange={handleFilterChange} />

          <PassengersTable
            passengers={filteredPassengers}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <PassengerDialog
          key={`${dialogMode}-${selectedPassenger?.id ?? "new"}`} // 🔥 fuerza el remount
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPassenger(undefined)
              setDialogMode("create")
            }
            setDialogOpen(open)
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
