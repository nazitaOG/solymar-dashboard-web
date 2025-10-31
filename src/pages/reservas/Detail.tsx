import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationDetailHeader } from "@/components/reservations/reservation-detail-header";
import { AuditPanel } from "@/components/reservations/audit-panel";
import { EntityTable, type Column } from "@/components/entities/entity-table";
import { HotelDialog } from "@/components/entities/hotel-dialog";
import { FlightDialog } from "@/components/entities/flight-dialog";
import { CruiseDialog } from "@/components/entities/cruise-dialog";
import { TransferDialog } from "@/components/entities/transfer-dialog";
import { ExcursionDialog } from "@/components/entities/excursion-dialog";
import { MedicalAssistDialog } from "@/components/entities/medical-assist-dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Hotel, Plane, Ship, Car, Compass, Heart } from "lucide-react";
import { FullPageLoader } from "@/components/FullPageLoader";

import { fetchAPI } from "@/lib/api/fetchApi";
import { normalizeReservation } from "@/lib/utils/reservation/normalize_reservation.utils";

import type {
  Reservation,
  ReservationDetail,
  ReservationState,
} from "@/lib/interfaces/reservation/reservation.interface";
import type { Hotel as HotelType } from "@/lib/interfaces/hotel/hotel.interface";
import type { Plane as PlaneType } from "@/lib/interfaces/plane/plane.interface";
import type { Cruise as CruiseType } from "@/lib/interfaces/cruise/cruise.interface";
import type { Transfer as TransferType } from "@/lib/interfaces/transfer/transfer.interface";
import type { Excursion as ExcursionType } from "@/lib/interfaces/excursion/excursion.interface";
import type { MedicalAssist as MedicalAssistType } from "@/lib/interfaces/medical_assist/medical_assist.interface";
import type { Pax as PaxType } from "@/lib/interfaces/pax/pax.interface";

import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ReservationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedReservation = location.state as Reservation | undefined;

  const initialReservation: ReservationDetail = {
    id: "",
    userId: "",
    state: "PENDING",
    createdBy: "",
    updatedBy: "",
    currencyTotals: [],
    hotels: [],
    planes: [],
    cruises: [],
    transfers: [],
    excursions: [],
    medicalAssists: [],
    paxReservations: [],
    createdAt: "",
    updatedAt: "",
  };
  const [reservation, setReservation] = useState<ReservationDetail>(initialReservation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [flightDialogOpen, setFlightDialogOpen] = useState(false);
  const [cruiseDialogOpen, setCruiseDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [excursionDialogOpen, setExcursionDialogOpen] = useState(false);
  const [medicalAssistDialogOpen, setMedicalAssistDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelType | undefined>();
  const [selectedFlight, setSelectedFlight] = useState<PlaneType | undefined>();
  const [selectedCruise, setSelectedCruise] = useState<CruiseType | undefined>();
  const [selectedTransfer, setSelectedTransfer] = useState<TransferType | undefined>();
  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionType | undefined>();
  const [selectedMedicalAssist, setSelectedMedicalAssist] = useState<MedicalAssistType | undefined>();

  // ✅ 1) Borrado desde la tabla (DELETE real al backend + estado)
const handleDeleteHotelServer = useCallback(async (hotelId: string) => {
  try {
    await fetchAPI<void>(`/hotels/${hotelId}`, { method: "DELETE" });
    setReservation((prev) => ({
      ...prev,
      hotels: prev.hotels.filter((h) => h.id !== hotelId),
    }));
  } catch (err) {
    console.error("❌ Error al eliminar hotel (server):", err);
    if (err instanceof Error) alert(err.message);
  }
}, []);

// ✅ 2) Borrado disparado por el diálogo (el diálogo ya hizo DELETE → solo estado)
const handleDeleteHotelLocal = useCallback((hotelId: string) => {
  setReservation((prev) => ({
    ...prev,
    hotels: prev.hotels.filter((h) => h.id !== hotelId),
  }));
}, []);


  // 🧭 Fetch detalle de reserva
  useEffect(() => {
    if (!id) return;

    const fetchEntities = async () => {
      try {
        setLoading(true);

        const [
          hotels,
          planes,
          cruises,
          transfers,
          excursions,
          medicalAssists,
        ] = await Promise.all([
          fetchAPI<HotelType[]>(`/hotels/reservation/${id}`),
          fetchAPI<PlaneType[]>(`/planes/reservation/${id}`),
          fetchAPI<CruiseType[]>(`/cruises/reservation/${id}`),
          fetchAPI<TransferType[]>(`/transfers/reservation/${id}`),
          fetchAPI<ExcursionType[]>(`/excursions/reservation/${id}`),
          fetchAPI<MedicalAssistType[]>(`/medical-assists/reservation/${id}`),
        ]);

        const baseReservation =
          passedReservation ??
          (await fetchAPI<ReservationDetail>(`/reservations/${id}?include=all`));

        const normalized = normalizeReservation({
          ...baseReservation,
          hotels,
          planes,
          cruises,
          transfers,
          excursions,
          medicalAssists,
        });

        setReservation(normalized);
      } catch (err) {
        console.error("Error al cargar reserva:", err);
        setError("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    };

    fetchEntities();
  }, [id, passedReservation]);

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
    setReservation({ ...reservation, state });
  };

  const handlePassengersChange = (passengers: PaxType[]) => {
    setReservation({
      ...reservation,
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

  const handleSaveHotel = (savedHotel: HotelType) => {
    setReservation((prev) => {
      const exists = prev.hotels.some((h) => h.id === savedHotel.id);
      const updatedHotels = exists
        ? prev.hotels.map((h) => (h.id === savedHotel.id ? savedHotel : h))
        : [...prev.hotels, savedHotel];
      return { ...prev, hotels: updatedHotels };
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
    setReservation({
      ...reservation,
      planes: reservation.planes.filter((p) => p.id !== flightId),
    });
  };

  // Cruises
  const handleCreateCruise = () => {
    setSelectedCruise(undefined);
    setCruiseDialogOpen(true);
  };

  const handleEditCruise = (cruise: Record<string, unknown>) => {
    setSelectedCruise(cruise as unknown as CruiseType);
    setCruiseDialogOpen(true);
  };

  const handleSaveCruise = (cruiseData: Partial<CruiseType>) => {
    if (selectedCruise) {
      setReservation({
        ...reservation,
        cruises: reservation.cruises.map((c) =>
          c.id === selectedCruise.id ? { ...c, ...cruiseData } : c
        ),
      });
    } else {
      const newCruise: CruiseType = {
        ...(cruiseData as CruiseType),
        id: `CRS-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        cruises: [...reservation.cruises, newCruise],
      });
    }
  };

  const handleDeleteCruise = (cruiseId: string) => {
    setReservation({
      ...reservation,
      cruises: reservation.cruises.filter((c) => c.id !== cruiseId),
    });
  };

  // Transfers
  const handleCreateTransfer = () => {
    setSelectedTransfer(undefined);
    setTransferDialogOpen(true);
  };

  const handleEditTransfer = (transfer: Record<string, unknown>) => {
    setSelectedTransfer(transfer as unknown as TransferType);
    setTransferDialogOpen(true);
  };

  const handleSaveTransfer = (transferData: Partial<TransferType>) => {
    if (selectedTransfer) {
      setReservation({
        ...reservation,
        transfers: reservation.transfers.map((t) =>
          t.id === selectedTransfer.id ? { ...t, ...transferData } : t
        ),
      });
    } else {
      const newTransfer: TransferType = {
        ...(transferData as TransferType),
        id: `TRF-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        transfers: [...reservation.transfers, newTransfer],
      });
    }
  };

  const handleDeleteTransfer = (transferId: string) => {
    setReservation({
      ...reservation,
      transfers: reservation.transfers.filter((t) => t.id !== transferId),
    });
  };

  // Excursions
  const handleCreateExcursion = () => {
    setSelectedExcursion(undefined);
    setExcursionDialogOpen(true);
  };

  const handleEditExcursion = (excursion: Record<string, unknown>) => {
    setSelectedExcursion(excursion as unknown as ExcursionType);
    setExcursionDialogOpen(true);
  };

  const handleSaveExcursion = (excursionData: Partial<ExcursionType>) => {
    if (selectedExcursion) {
      setReservation({
        ...reservation,
        excursions: reservation.excursions.map((e) =>
          e.id === selectedExcursion.id ? { ...e, ...excursionData } : e
        ),
      });
    } else {
      const newExcursion: ExcursionType = {
        ...(excursionData as ExcursionType),
        id: `EXC-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        excursions: [...reservation.excursions, newExcursion],
      });
    }
  };

  const handleDeleteExcursion = (excursionId: string) => {
    setReservation({
      ...reservation,
      excursions: reservation.excursions.filter((e) => e.id !== excursionId),
    });
  };

  // Medical Assists
  const handleCreateMedicalAssist = () => {
    setSelectedMedicalAssist(undefined);
    setMedicalAssistDialogOpen(true);
  };

  const handleEditMedicalAssist = (assist: Record<string, unknown>) => {
    setSelectedMedicalAssist(assist as unknown as MedicalAssistType);
    setMedicalAssistDialogOpen(true);
  };

  const handleSaveMedicalAssist = (assistData: Partial<MedicalAssistType>) => {
    if (selectedMedicalAssist) {
      setReservation({
        ...reservation,
        medicalAssists: reservation.medicalAssists.map((a) =>
          a.id === selectedMedicalAssist.id ? { ...a, ...assistData } : a
        ),
      });
    } else {
      const newAssist: MedicalAssistType = {
        ...(assistData as MedicalAssistType),
        id: `MED-${Date.now()}`,
      };
      setReservation({
        ...reservation,
        medicalAssists: [...reservation.medicalAssists, newAssist],
      });
    }
  };

  const handleDeleteMedicalAssist = (assistId: string) => {
    setReservation({
      ...reservation,
      medicalAssists: reservation.medicalAssists.filter((a) => a.id !== assistId),
    });
  };

  // ---------------- Formatters ----------------
  function formatCurrency(
    value?: number | null,
    currency?: string,
    locale = "es-AR"
  ): string {
    const safeCurrency =
      currency && typeof currency === "string" && currency.length === 3
        ? currency
        : "USD";
    const safeValue = typeof value === "number" ? value : 0;

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: safeCurrency,
        minimumFractionDigits: 2,
      }).format(safeValue);
    } catch {
      return `${safeCurrency} ${safeValue.toFixed(2)}`;
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return "—";
    return format(parsed, "dd MMM yyyy", { locale: es });
  };

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
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
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
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  const cruiseColumns: Column[] = [
    { key: "shipName", label: "Crucero" },
    { key: "route", label: "Ruta" },
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
    { key: "provider", label: "Naviera" },
    { key: "bookingReference", label: "Referencia" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  const transferColumns: Column[] = [
    { key: "origin", label: "Origen" },
    { key: "destination", label: "Destino" },
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
    { key: "provider", label: "Proveedor" },
    { key: "transportType", label: "Tipo" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  const excursionColumns: Column[] = [
    { key: "excursionName", label: "Excursión" },
    { key: "location", label: "Lugar" },
    {
      key: "date",
      label: "Fecha",
      render: (value) => <div className="text-sm">{formatDate(String(value))}</div>,
    },
    { key: "provider", label: "Proveedor" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice), String(row.currency))}
          </div>
        </div>
      ),
    },
  ];

  const medicalAssistColumns: Column[] = [
    { key: "provider", label: "Proveedor" },
    { key: "planName", label: "Plan" },
    {
      key: "startDate",
      label: "Inicio / Fin",
      render: (_value, row) => (
        <div className="text-sm">
          <div>{formatDate(String(row.startDate))}</div>
          <div className="text-muted-foreground">{formatDate(String(row.endDate))}</div>
        </div>
      ),
    },
    { key: "coverage", label: "Cobertura" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid), String(row.currency))}
          </div>
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

                <div className="text-xs text-muted-foreground mb-2">
                  Total de hotels en estado: {reservation.hotels.length}
                </div>

                <EntityTable
                  data={reservation.hotels as unknown as Record<string, unknown>[]}
                  columns={hotelColumns}
                  onEdit={handleEditHotel}
                  onDelete={handleDeleteHotelServer}
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

              <TabsContent value="cruises" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateCruise}>Crear Crucero</Button>
                </div>
                <EntityTable
                  data={reservation.cruises as unknown as Record<string, unknown>[]}
                  columns={cruiseColumns}
                  onEdit={handleEditCruise}
                  onDelete={handleDeleteCruise}
                  emptyMessage="No hay cruceros agregados aún"
                />
              </TabsContent>

              <TabsContent value="transfers" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateTransfer}>Crear Traslado</Button>
                </div>
                <EntityTable
                  data={reservation.transfers as unknown as Record<string, unknown>[]}
                  columns={transferColumns}
                  onEdit={handleEditTransfer}
                  onDelete={handleDeleteTransfer}
                  emptyMessage="No hay traslados agregados aún"
                />
              </TabsContent>

              <TabsContent value="excursions" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateExcursion}>Crear Excursión</Button>
                </div>
                <EntityTable
                  data={reservation.excursions as unknown as Record<string, unknown>[]}
                  columns={excursionColumns}
                  onEdit={handleEditExcursion}
                  onDelete={handleDeleteExcursion}
                  emptyMessage="No hay excursiones agregadas aún"
                />
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={handleCreateMedicalAssist}>Crear Asistencia</Button>
                </div>
                <EntityTable
                  data={reservation.medicalAssists as unknown as Record<string, unknown>[]}
                  columns={medicalAssistColumns}
                  onEdit={handleEditMedicalAssist}
                  onDelete={handleDeleteMedicalAssist}
                  emptyMessage="No hay asistencias agregadas aún"
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
        onDelete={handleDeleteHotelLocal}
      />

      <FlightDialog
        open={flightDialogOpen}
        onOpenChange={setFlightDialogOpen}
        flight={selectedFlight}
        reservationId={id}
        onSave={handleSaveFlight}
        onDelete={handleDeleteFlight}
      />

      <CruiseDialog
        open={cruiseDialogOpen}
        onOpenChange={setCruiseDialogOpen}
        cruise={selectedCruise}
        reservationId={id}
        onSave={handleSaveCruise}
        onDelete={handleDeleteCruise}
      />

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        transfer={selectedTransfer}
        reservationId={id}
        onSave={handleSaveTransfer}
        onDelete={handleDeleteTransfer}
      />

      <ExcursionDialog
        open={excursionDialogOpen}
        onOpenChange={setExcursionDialogOpen}
        excursion={selectedExcursion}
        reservationId={id}
        onSave={handleSaveExcursion}
        onDelete={handleDeleteExcursion}
      />

      <MedicalAssistDialog
        open={medicalAssistDialogOpen}
        onOpenChange={setMedicalAssistDialogOpen}
        assist={selectedMedicalAssist}
        reservationId={id}
        onSave={handleSaveMedicalAssist}
        onDelete={handleDeleteMedicalAssist}
      />
    </DashboardLayout>
  );
}
