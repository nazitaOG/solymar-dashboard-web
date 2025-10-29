import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationDetailHeader } from "@/components/reservations/reservation-detail-header";
import { AuditPanel } from "@/components/reservations/audit-panel";
import { EntityTable, type Column } from "@/components/entities/entity-table";
import { HotelDialog } from "@/components/entities/hotel-dialog";
import { FlightDialog } from "@/components/entities/flight-dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Hotel, Plane, Ship, Car, Compass, Heart } from "lucide-react";
import { FullPageLoader } from "@/components/FullPageLoader";

import { fetchAPI } from "@/lib/api/fetchApi";
import type { ReservationDetail, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type { Hotel as HotelType } from "@/lib/interfaces/hotel/hotel.interface";
import type { Plane as PlaneType } from "@/lib/interfaces/plane/plane.interface";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReservationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelType | undefined>();
  const [selectedFlight, setSelectedFlight] = useState<PlaneType | undefined>();

  // ✅ Fetch detalle de reserva con include
  useEffect(() => {
    if (!id) return;

    const fetchReservation = async () => {
      console.log(`[ReservationDetailPage] 🔄 Iniciando fetch de reserva ID=${id}...`);
      setLoading(true);
      setError(null);

      try {
        const res = await fetchAPI<ReservationDetail>(
          `/reservations/${id}?include=paxReservations,currencyTotals,hotels,planes,cruises,transfers,excursions,medicalAssists`
        );

        console.log("[ReservationDetailPage] ✅ Reserva cargada correctamente:", res);
        if (!res) {
          console.warn("[ReservationDetailPage] ⚠️ Respuesta vacía o inválida:", res);
          setError("Reserva no encontrada");
          return;
        }

        // Normalización preventiva (evita errores tipo 'undefined.map')
        const safeRes = {
          ...res,
          paxReservations: res.paxReservations ?? [],
          currencyTotals: res.currencyTotals ?? [],
          hotels: res.hotels ?? [],
          planes: res.planes ?? [],
          cruises: res.cruises ?? [],
          transfers: res.transfers ?? [],
          excursions: res.excursions ?? [],
          medicalAssists: res.medicalAssists ?? [],
        };

        setReservation(safeRes);
      } catch (err) {
        console.error("[ReservationDetailPage] ❌ Error al cargar la reserva:", err);
        setError("No se pudo cargar la reserva");
      } finally {
        console.log("[ReservationDetailPage] 🏁 Fetch finalizado.");
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // 🧩 Loading o error
  if (loading) return <FullPageLoader />;
  if (error || !reservation) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-muted-foreground">{error ?? "Reserva no encontrada"}</p>
          <Button onClick={() => navigate("/reservas")}>Volver a reservas</Button>
        </div>
      </DashboardLayout>
    );
  }

  // ---------------- Handlers ----------------
  const handleStateChange = (state: ReservationState) => {
    console.log("[ReservationDetailPage] 🔄 Cambio de estado:", state);
    setReservation({ ...reservation, state });
  };

  const handlePassengersChange = (passengers: Pax[]) => {
    console.log("[ReservationDetailPage] 🧍 Actualizando pasajeros:", passengers);
    setReservation({
      ...reservation,
      paxReservations: passengers.map((pax) => ({ pax })),
    });
  };

  // Hotels
  const handleCreateHotel = () => {
    console.log("[ReservationDetailPage] ➕ Crear nuevo hotel");
    setSelectedHotel(undefined);
    setHotelDialogOpen(true);
  };

  const handleEditHotel = (hotel: Record<string, unknown>) => {
    console.log("[ReservationDetailPage] ✏️ Editar hotel:", hotel);
    setSelectedHotel(hotel as unknown as HotelType);
    setHotelDialogOpen(true);
  };

  const handleSaveHotel = (hotelData: Partial<HotelType>) => {
    console.log("[ReservationDetailPage] 💾 Guardar hotel:", hotelData);
    if (selectedHotel) {
      setReservation({
        ...reservation,
        hotels: reservation.hotels.map((h) =>
          h.id === selectedHotel.id ? { ...h, ...hotelData } : h
        ),
      });
    } else {
      const newHotel: HotelType = {
        ...(hotelData as HotelType),
        id: `HTL-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        hotels: [...reservation.hotels, newHotel],
      });
    }
  };

  const handleDeleteHotel = (hotelId: string) => {
    console.log("[ReservationDetailPage] 🗑️ Eliminar hotel ID:", hotelId);
    setReservation({
      ...reservation,
      hotels: reservation.hotels.filter((h) => h.id !== hotelId),
    });
  };

  // Flights
  const handleCreateFlight = () => {
    console.log("[ReservationDetailPage] ✈️ Crear nuevo vuelo");
    setSelectedFlight(undefined);
    setFlightDialogOpen(true);
  };

  const handleEditFlight = (flight: Record<string, unknown>) => {
    console.log("[ReservationDetailPage] 🛫 Editar vuelo:", flight);
    setSelectedFlight(flight as unknown as PlaneType);
    setFlightDialogOpen(true);
  };

  const handleSaveFlight = (flightData: Partial<PlaneType>) => {
    console.log("[ReservationDetailPage] 💾 Guardar vuelo:", flightData);
    if (selectedFlight) {
      setReservation({
        ...reservation,
        planes: reservation.planes.map((p) =>
          p.id === selectedFlight.id ? { ...p, ...flightData } : p
        ),
      });
    } else {
      const newFlight: PlaneType = {
        ...(flightData as PlaneType),
        id: `PLN-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        planes: [...reservation.planes, newFlight],
      });
    }
  };

  const handleDeleteFlight = (flightId: string) => {
    console.log("[ReservationDetailPage] 🗑️ Eliminar vuelo ID:", flightId);
    setReservation({
      ...reservation,
      planes: reservation.planes.filter((p) => p.id !== flightId),
    });
  };

  // ---------------- Formatters ----------------
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "dd MMM yyyy", { locale: es });

  // ---------------- Column defs ----------------
  const hotelColumns: Column[] = [
    { key: "hotelName", label: "Hotel" },
    { key: "city", label: "Ciudad" },
    {
      key: "startDate",
      label: "Check-in / Check-out",
      render: (_value, row) => (
        <div className="text-sm">
          <div>{formatDate(String(row.startDate))}</div>
          <div className="text-muted-foreground">{formatDate(String(row.endDate))}</div>
        </div>
      ),
    },
    { key: "roomType", label: "Habitación" },
    { key: "provider", label: "Proveedor" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(Number(row.amountPaid), String(row.currency))}</div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  const flightColumns: Column[] = [
    {
      key: "departure",
      label: "Ruta",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">{String(row.departure)}</div>
          <div className="text-muted-foreground">→ {String(row.arrival)}</div>
        </div>
      ),
    },
    {
      key: "departureDate",
      label: "Salida / Llegada",
      render: (_value, row) => (
        <div className="text-sm">
          <div>{formatDate(String(row.departureDate))}</div>
          <div className="text-muted-foreground">{formatDate(String(row.arrivalDate))}</div>
        </div>
      ),
    },
    { key: "provider", label: "Aerolínea" },
    { key: "bookingReference", label: "Referencia" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(Number(row.amountPaid), String(row.currency))}</div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  // ---------------- Render ----------------
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/reservas")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main */}
          <div className="space-y-6">
            <ReservationDetailHeader
              reservation={reservation}
              availablePassengers={reservation.paxReservations.map((r) => r.pax)}
              onStateChange={handleStateChange}
              onPassengersChange={handlePassengersChange}
            />

            <Tabs defaultValue="hotels" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="hotels" className="gap-2">
                  <Hotel className="h-4 w-4" /> Hoteles
                </TabsTrigger>
                <TabsTrigger value="flights" className="gap-2">
                  <Plane className="h-4 w-4" /> Vuelos
                </TabsTrigger>
                <TabsTrigger value="cruises" className="gap-2">
                  <Ship className="h-4 w-4" /> Cruceros
                </TabsTrigger>
                <TabsTrigger value="transfers" className="gap-2">
                  <Car className="h-4 w-4" /> Traslados
                </TabsTrigger>
                <TabsTrigger value="excursions" className="gap-2">
                  <Compass className="h-4 w-4" /> Excursiones
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-2">
                  <Heart className="h-4 w-4" /> Asistencias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hotels" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateHotel}>Crear Hotel</Button>
                </div>
                <EntityTable
                  data={reservation.hotels as unknown as Record<string, unknown>[]}
                  columns={hotelColumns}
                  onEdit={handleEditHotel}
                  onDelete={handleDeleteHotel}
                  emptyMessage="No hay hoteles agregados aún"
                />
              </TabsContent>

              <TabsContent value="flights" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateFlight}>Crear Vuelo</Button>
                </div>
                <EntityTable
                  data={reservation.planes as unknown as Record<string, unknown>[]}
                  columns={flightColumns}
                  onEdit={handleEditFlight}
                  onDelete={handleDeleteFlight}
                  emptyMessage="No hay vuelos agregados aún"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Audit Panel */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <AuditPanel reservation={reservation} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <HotelDialog
        open={hotelDialogOpen}
        onOpenChange={setHotelDialogOpen}
        hotel={selectedHotel}
        reservationId={id}
        onSave={handleSaveHotel}
        onDelete={handleDeleteHotel}
      />

      <FlightDialog
        open={flightDialogOpen}
        onOpenChange={setFlightDialogOpen}
        flight={selectedFlight}
        reservationId={id}
        onSave={handleSaveFlight}
        onDelete={handleDeleteFlight}
      />
    </DashboardLayout>
  );
}
