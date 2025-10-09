import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationDetailHeader } from "@/components/reservations/reservation-detail-header";
import { AuditPanel } from "@/components/reservations/audit-panel";
import { EntityTable, type Column } from "@/components/entities/entity-table";
import { HotelDialog } from "@/components/entities/hotel-dialog";
import { FlightDialog } from "@/components/entities/flight-dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Hotel, Plane, Ship, Car, Compass, Heart } from "lucide-react";

import { mockReservationDetails, mockPassengers } from "@/lib/mock-data";
import type {
  ReservationState,
  Pax,
  Hotel as HotelType,
  Plane as PlaneType,
  ReservationDetail,
} from "@/lib/types";

import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReservationDetailPage() {
  const { id = "" } = useParams<{ id: string }>(); // ✅ tipar el param
  const navigate = useNavigate();

  const reservation = mockReservationDetails[id] as ReservationDetail | undefined;
  const [currentReservation, setCurrentReservation] = useState<ReservationDetail | null>(reservation ?? null);

  // Dialog states
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelType | undefined>();
  const [selectedFlight, setSelectedFlight] = useState<PlaneType | undefined>();

  if (!currentReservation) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-muted-foreground">Reserva no encontrada</p>
          <Button onClick={() => navigate("/reservas")}>Volver a reservas</Button>
        </div>
      </DashboardLayout>
    );
  }

  // ---------------- Handlers ----------------
  const handleStateChange = (state: ReservationState) => {
    setCurrentReservation({ ...currentReservation, state });
  };

  const handlePassengersChange = (passengers: Pax[]) => {
    setCurrentReservation({
      ...currentReservation,
      paxReservations: passengers.map((pax) => ({ pax })),
    });
  };

  // Hotels
  const handleCreateHotel = () => {
    setSelectedHotel(undefined);
    setHotelDialogOpen(true);
  };

  const handleEditHotel = (hotel: Record<string, unknown>) => {
    setSelectedHotel(hotel as unknown as HotelType);
    setHotelDialogOpen(true);
  };

  const handleSaveHotel = (hotelData: Partial<HotelType>) => {
    if (selectedHotel) {
      setCurrentReservation({
        ...currentReservation,
        hotels: currentReservation.hotels.map((h) =>
          h.id === selectedHotel.id ? { ...h, ...hotelData } : h
        ),
      });
    } else {
      const newHotel: HotelType = {
        ...(hotelData as HotelType),
        id: `HTL-${Date.now()}`,
      };
      setCurrentReservation({
        ...currentReservation,
        hotels: [...currentReservation.hotels, newHotel],
      });
    }
  };

  const handleDeleteHotel = (hotelId: string) => {
    setCurrentReservation({
      ...currentReservation,
      hotels: currentReservation.hotels.filter((h) => h.id !== hotelId),
    });
  };

  // Flights
  const handleCreateFlight = () => {
    setSelectedFlight(undefined);
    setFlightDialogOpen(true);
  };

  const handleEditFlight = (flight: Record<string, unknown>) => {
    setSelectedFlight(flight as unknown as PlaneType);
    setFlightDialogOpen(true);
  };

  const handleSaveFlight = (flightData: Partial<PlaneType>) => {
    if (selectedFlight) {
      setCurrentReservation({
        ...currentReservation,
        planes: currentReservation.planes.map((p) =>
          p.id === selectedFlight.id ? { ...p, ...flightData } : p
        ),
      });
    } else {
      const newFlight: PlaneType = {
        ...(flightData as PlaneType),
        id: `PLN-${Date.now()}`,
      };
      setCurrentReservation({
        ...currentReservation,
        planes: [...currentReservation.planes, newFlight],
      });
    }
  };

  const handleDeleteFlight = (flightId: string) => {
    setCurrentReservation({
      ...currentReservation,
      planes: currentReservation.planes.filter((p) => p.id !== flightId),
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

  // ---------------- Column defs (tipadas) ----------------
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
              reservation={currentReservation}
              availablePassengers={mockPassengers}
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
                  data={currentReservation.hotels as unknown as Record<string, unknown>[]}
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
                  data={currentReservation.planes as unknown as Record<string, unknown>[]}
                  columns={flightColumns}
                  onEdit={handleEditFlight}
                  onDelete={handleDeleteFlight}
                  emptyMessage="No hay vuelos agregados aún"
                />
              </TabsContent>

              {/* placeholders para el resto de tabs */}
              <TabsContent value="cruises" className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground mb-4">No hay cruceros agregados aún</p>
                  <Button>Crear Crucero</Button>
                </div>
              </TabsContent>

              <TabsContent value="transfers" className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground mb-4">No hay traslados agregados aún</p>
                  <Button>Crear Traslado</Button>
                </div>
              </TabsContent>

              <TabsContent value="excursions" className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground mb-4">No hay excursiones agregadas aún</p>
                  <Button>Crear Excursión</Button>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-muted-foreground mb-4">No hay asistencias médicas agregadas aún</p>
                  <Button>Crear Asistencia Médica</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Audit Panel */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <AuditPanel reservation={currentReservation} />
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
