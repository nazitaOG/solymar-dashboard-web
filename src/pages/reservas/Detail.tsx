import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReservationDetailHeader } from "@/components/reservations/reservation-detail-header";
import { AuditPanel } from "@/components/reservations/audit-panel";
import { EntityTable, type Column } from "@/components/entities/table/entity-table";
import { HotelDialog } from "@/components/entities/hotel-dialog";
import { PlaneDialog } from "@/components/entities/plane-dialog";
import { CruiseDialog } from "@/components/entities/cruise-dialog";
import { TransferDialog } from "@/components/entities/transfer-dialog";
import { ExcursionDialog } from "@/components/entities/excursion-dialog";
import { MedicalAssistDialog } from "@/components/entities/medical-assist-dialog";
import { CarRentalDialog } from "@/components/entities/car-rental-dialog";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Hotel, Plane, Ship, Car, Compass, Heart, CarFront } from "lucide-react";
import { FullPageLoader } from "@/components/FullPageLoader";

import { fetchAPI } from "@/lib/api/fetchApi";
import { normalizeReservation } from "@/lib/utils/reservation/normalize_reservation.utils";

import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";
import type {
  Reservation,
  ReservationCurrencyTotal,
  ReservationDetail,
} from "@/lib/interfaces/reservation/reservation.interface";
import type { Hotel as HotelType } from "@/lib/interfaces/hotel/hotel.interface";
import type { Plane as PlaneType } from "@/lib/interfaces/plane/plane.interface";
import type { Cruise as CruiseType } from "@/lib/interfaces/cruise/cruise.interface";
import type { Transfer as TransferType } from "@/lib/interfaces/transfer/transfer.interface";
import type { Excursion as ExcursionType } from "@/lib/interfaces/excursion/excursion.interface";
import type { MedicalAssist as MedicalAssistType } from "@/lib/interfaces/medical_assist/medical_assist.interface";
import type { CarRental } from "@/lib/interfaces/car_rental/car_rental.interface";
import type { Pax as PaxType } from "@/lib/interfaces/pax/pax.interface";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Currency, CurrencyTotal } from "@/lib/interfaces/currency/currency.interface";


export default function ReservationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const passedReservation = location.state as Reservation | undefined;


  const initialReservation: ReservationDetail = {
    id: "",
    code: 0,
    name: "",
    userId: "",
    state: ReservationState.PENDING,
    createdBy: "",
    updatedBy: "",
    currencyTotals: [],
    hotels: [],
    planes: [],
    cruises: [],
    transfers: [],
    excursions: [],
    medicalAssists: [],
    carRentals: [], // 🆕 Inicializar array vacío
    paxReservations: [],
    createdAt: "",
    updatedAt: "",
  };
  const [reservation, setReservation] = useState<ReservationDetail>(initialReservation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [planeDialogOpen, setPlaneDialogOpen] = useState(false);
  const [cruiseDialogOpen, setCruiseDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [excursionDialogOpen, setExcursionDialogOpen] = useState(false);
  const [medicalAssistDialogOpen, setMedicalAssistDialogOpen] = useState(false);
  // 🆕 Estado para Car Rental Dialog
  const [carRentalDialogOpen, setCarRentalDialogOpen] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState<HotelType | undefined>();
  const [selectedPlane, setSelectedPlane] = useState<PlaneType | undefined>();
  const [selectedCruise, setSelectedCruise] = useState<CruiseType | undefined>();
  const [selectedTransfer, setSelectedTransfer] = useState<TransferType | undefined>();
  const [selectedExcursion, setSelectedExcursion] = useState<ExcursionType | undefined>();
  const [selectedMedicalAssist, setSelectedMedicalAssist] = useState<MedicalAssistType | undefined>();
  // 🆕 Estado selección Car Rental
  const [selectedCarRental, setSelectedCarRental] = useState<CarRental | undefined>();


  const fmt = (iso: string | null | undefined): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return format(d, "dd MMM yyyy HH:mm", { locale: es });
  };

  // 🔥 Helper: Refrescar solo la data "meta" de la reserva (fechas, usuario que modificó)
  // Esto asegura que el AuditPanel muestre la info real del servidor
  const updateReservationMetadata = useCallback(async () => {
    if (!id) return;
    try {
      // Pedimos la reserva actualizada al backend
      const freshData = await fetchAPI<ReservationDetail>(`/reservations/${id}`);

      setReservation((prev) => ({
        ...prev,
        updatedAt: freshData.updatedAt,
        updatedBy: freshData.updatedBy,
        // Si el backend recalcula estado o totales, podrías actualizar más cosas aquí
      }));
    } catch (err) {
      console.error("⚠️ No se pudo actualizar la metadata de la reserva:", err);
    }
  }, [id]);


  // ✅ 1) Borrado desde la tabla (DELETE real al backend + estado)
  const handleDeleteHotelServer = useCallback(async (hotelId: string) => {
    try {
      await fetchAPI<void>(`/hotels/${hotelId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        hotels: prev.hotels.filter((h) => h.id !== hotelId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar hotel (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // ✅ 2) Borrado disparado por el diálogo (el diálogo ya hizo DELETE → solo estado)
  const handleDeleteHotelLocal = useCallback((hotelId: string) => {
    setReservation((prev) => ({
      ...prev,
      hotels: prev.hotels.filter((h) => h.id !== hotelId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // ✅ 1) Borrado desde la tabla (DELETE real al backend + estado)
  const handleDeletePlaneServer = useCallback(async (planeId: string) => {
    try {
      await fetchAPI<void>(`/planes/${planeId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        planes: prev.planes.filter((p) => p.id !== planeId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar vuelo (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // ✅ 2) Borrado disparado por el diálogo (el diálogo ya hizo DELETE → solo estado)
  const handleDeletePlaneLocal = useCallback((planeId: string) => {
    setReservation((prev) => ({
      ...prev,
      planes: prev.planes.filter((p) => p.id !== planeId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // ✅ 1) Borrado desde la tabla (DELETE real al backend + estado)
  const handleDeleteCruiseServer = useCallback(async (cruiseId: string) => {
    try {
      await fetchAPI<void>(`/cruises/${cruiseId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        cruises: prev.cruises.filter((c) => c.id !== cruiseId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar crucero (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // ✅ 2) Borrado disparado por el diálogo (ya hizo DELETE → solo actualiza estado)
  const handleDeleteCruiseLocal = useCallback((cruiseId: string) => {
    setReservation((prev) => ({
      ...prev,
      cruises: prev.cruises.filter((c) => c.id !== cruiseId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // 🗑️ DELETE desde la tabla (real al backend + actualiza estado)
  const handleDeleteTransferServer = useCallback(async (transferId: string) => {
    try {
      await fetchAPI<void>(`/transfers/${transferId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        transfers: prev.transfers.filter((t) => t.id !== transferId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar traslado (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // 🗑️ DELETE desde el diálogo (ya lo borró, actualiza estado)
  const handleDeleteTransferLocal = useCallback((transferId: string) => {
    setReservation((prev) => ({
      ...prev,
      transfers: prev.transfers.filter((t) => t.id !== transferId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // 🗑️ DELETE desde la tabla (real al backend + actualiza estado)
  const handleDeleteExcursionServer = useCallback(async (excursionId: string) => {
    try {
      await fetchAPI<void>(`/excursions/${excursionId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        excursions: prev.excursions.filter((e) => e.id !== excursionId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar excursión (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // 🗑️ DELETE desde el diálogo (ya lo borró → solo actualiza estado)
  const handleDeleteExcursionLocal = useCallback((excursionId: string) => {
    setReservation((prev) => ({
      ...prev,
      excursions: prev.excursions.filter((e) => e.id !== excursionId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // ✅ DELETE desde la tabla (real al backend + estado)
  const handleDeleteMedicalAssistServer = useCallback(async (assistId: string) => {
    try {
      await fetchAPI<void>(`/medical-assists/${assistId}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        medicalAssists: prev.medicalAssists.filter((a) => a.id !== assistId),
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar asistencia médica (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // ✅ DELETE desde el diálogo (ya se eliminó en backend → solo actualizar estado local)
  const handleDeleteMedicalAssistLocal = useCallback((assistId: string) => {
    setReservation((prev) => ({
      ...prev,
      medicalAssists: prev.medicalAssists.filter((a) => a.id !== assistId),
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);

  // 🆕 ✅ DELETE Car Rental (Server)
  const handleDeleteCarRentalServer = useCallback(async (id: string) => {
    try {
      await fetchAPI<void>(`/car-rentals/${id}`, { method: "DELETE" });
      setReservation((prev) => ({
        ...prev,
        carRentals: prev.carRentals?.filter((c) => c.id !== id) ?? [],
      }));
      updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
    } catch (err) {
      console.error("❌ Error al eliminar alquiler (server):", err);
      if (err instanceof Error) alert(err.message);
    }
  }, [updateReservationMetadata]);

  // 🆕 ✅ DELETE Car Rental (Local)
  const handleDeleteCarRentalLocal = useCallback((id: string) => {
    setReservation((prev) => ({
      ...prev,
      carRentals: prev.carRentals?.filter((c) => c.id !== id) ?? [],
    }));
    updateReservationMetadata(); // 🔄 Actualizar fecha/usuario
  }, [updateReservationMetadata]);


  // 🧭 Fetch detalle de reserva
  useEffect(() => {
    if (!id) return

    const fetchEntities = async () => {
      try {
        setLoading(true)

        let baseReservation: ReservationDetail

        if (passedReservation) {
          // 🔹 Ya vino del listado → usarlo directamente
          baseReservation = {
            ...passedReservation,
            // garantizar que los campos faltantes existan
            hotels: [],
            planes: [],
            cruises: [],
            transfers: [],
            excursions: [],
            medicalAssists: [],
            carRentals: [], // 🆕
          } as ReservationDetail
        } else {
          // 🔹 Si entrás por URL → fetch completo
          baseReservation = await fetchAPI<ReservationDetail>(
            `/reservations/${id}?include=paxReservations,currencyTotals`
          )
        }

        // 🔸 Fetch de entidades relacionadas (siempre)
        const [
          hotels,
          planes,
          cruises,
          transfers,
          excursions,
          medicalAssists,
          carRentals, // 🆕 Fetch Car Rentals
        ] = await Promise.all([
          fetchAPI<HotelType[]>(`/hotels/reservation/${id}`),
          fetchAPI<PlaneType[]>(`/planes/reservation/${id}`),
          fetchAPI<CruiseType[]>(`/cruises/reservation/${id}`),
          fetchAPI<TransferType[]>(`/transfers/reservation/${id}`),
          fetchAPI<ExcursionType[]>(`/excursions/reservation/${id}`),
          fetchAPI<MedicalAssistType[]>(`/medical-assists/reservation/${id}`),
          fetchAPI<CarRental[]>(`/car-rentals/reservation/${id}`), // 🆕
        ])

        const normalized = normalizeReservation({
          ...baseReservation,
          hotels,
          planes,
          cruises,
          transfers,
          excursions,
          medicalAssists,
          // Nota: Si normalizeReservation aún no soporta carRentals,
          // lo agregamos manualmente abajo o actualizamos el helper.
          // Aquí asumo que lo agregamos al objeto final.
        })

        // 🆕 Inyectamos carRentals si normalizeReservation no lo hace
        setReservation({ ...normalized, carRentals })

      } catch (err) {
        console.error("Error al cargar reserva:", err)
        setError("No se pudo cargar la reserva")
      } finally {
        setLoading(false)
      }
    }

    fetchEntities()
  }, [id, passedReservation])

  // 🔁 Recalcular currencyTotals cuando cambian las entidades
  useEffect(() => {
    if (!reservation) return

    const totalsMap = new Map<string, { totalPrice: number; amountPaid: number }>()

    const addTotals = (
      items: {
        currency?: string
        totalPrice?: number | string | null
        amountPaid?: number | string | null
      }[]
    ) => {
      // Protección contra items undefined o null
      if (!items) return;

      for (const item of items) {
        const currency = item.currency ?? "USD"
        const totalPrice = Number(item.totalPrice ?? 0)
        const amountPaid = Number(item.amountPaid ?? 0)
        const existing = totalsMap.get(currency) ?? { totalPrice: 0, amountPaid: 0 }
        totalsMap.set(currency, {
          totalPrice: existing.totalPrice + totalPrice,
          amountPaid: existing.amountPaid + amountPaid,
        })
      }
    }

    // 🔹 Sumar totales de cada entidad asociada
    addTotals(reservation.hotels)
    addTotals(reservation.planes)
    addTotals(reservation.cruises)
    addTotals(reservation.transfers)
    addTotals(reservation.excursions)
    addTotals(reservation.medicalAssists)
    addTotals(reservation.carRentals) // 🆕 Sumar totales de Autos

    // 🔸 Crear nuevo array de currencyTotals
    const recalculatedTotals: ReservationCurrencyTotal[] = Array.from(totalsMap.entries()).map(
      ([currencyCode, totals]) => ({
        id: `local-${currencyCode}`,
        reservationId: reservation.id,
        currency:
          currencyCode === "USD"
            ? Currency.USD
            : currencyCode === "ARS"
              ? Currency.ARS
              : (currencyCode as Currency), // fallback seguro
        totalPrice: totals.totalPrice,
        amountPaid: totals.amountPaid,
        createdAt: reservation.createdAt,
        updatedAt: new Date().toISOString(),
      })
    );


    // ✅ Actualizar estado con cast seguro a CurrencyTotal[]
    setReservation((prev) =>
      prev
        ? {
          ...prev,
          currencyTotals: recalculatedTotals as unknown as CurrencyTotal[],
        }
        : prev
    )
  }, [
    reservation?.id,
    reservation?.createdAt,
    reservation?.hotels,
    reservation?.planes,
    reservation?.cruises,
    reservation?.transfers,
    reservation?.excursions,
    reservation?.medicalAssists,
    reservation?.carRentals,
  ])


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
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };

  const handleNameChange = (newName: string) => {
    setReservation(prev => ({ ...prev, name: newName }));
  };

  const handlePassengersChange = async (passengers: PaxType[]) => {
    try {
      // 🔹 1. Crear body con los IDs
      const paxIds = passengers.map((p) => p.id);

      // 🔹 2. PATCH al backend
      const updated = await fetchAPI<ReservationDetail>(`/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ paxIds }),
      });

      // 🔹 3. Actualizar estado local sin refetch
      setReservation((prev) => ({
        ...prev,
        paxReservations: updated.paxReservations ?? passengers.map((p) => ({ pax: p })),
        // Aquí SÍ tenemos la data fresca porque updated ya viene del PATCH
        updatedAt: updated.updatedAt,
        updatedBy: updated.updatedBy,
      }));

    } catch (error) {
      console.error("❌ Error al vincular pasajeros a la reserva:", error);
      alert("No se pudieron guardar los pasajeros en la reserva.");
    }
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
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };

  // Planes
  const handleCreatePlane = () => {
    setSelectedPlane(undefined);
    setPlaneDialogOpen(true);
  };

  const handleEditPlane = (plane: Record<string, unknown>) => {
    setSelectedPlane(plane as unknown as PlaneType);
    setPlaneDialogOpen(true);
  };

  // 💾 Guardar (creación o edición)
  const handleSavePlane = (savedPlane: PlaneType) => {
    setReservation((prev) => {
      const exists = prev.planes.some((p) => p.id === savedPlane.id);
      const updatedPlanes = exists
        ? prev.planes.map((p) => (p.id === savedPlane.id ? savedPlane : p))
        : [...prev.planes, savedPlane];
      return { ...prev, planes: updatedPlanes };
    });

    // FIX CRÍTICO: Actualizar selectedPlane con los datos frescos
    setSelectedPlane(savedPlane);
    updateReservationMetadata(); // 🔄 Actualizar auditoría
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

  const handleSaveCruise = (savedCruise: CruiseType) => {
    setReservation((prev) => {
      const exists = prev.cruises.some((c) => c.id === savedCruise.id);
      const updatedCruises = exists
        ? prev.cruises.map((c) => (c.id === savedCruise.id ? savedCruise : c))
        : [...prev.cruises, savedCruise];
      return { ...prev, cruises: updatedCruises };
    });
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };


  // Transfers
  const handleCreateTransfer = () => {
    setSelectedTransfer(undefined);
    setTransferDialogOpen(true);
  };

  // ✏️ Editar (abre diálogo con datos existentes)
  const handleEditTransfer = (transfer: Record<string, unknown>) => {
    setSelectedTransfer(transfer as unknown as TransferType);
    setTransferDialogOpen(true);
  };

  // 💾 Guardar traslado (creación o edición)
  const handleSaveTransfer = (savedTransfer: TransferType) => {
    setReservation((prev) => {
      const exists = prev.transfers.some((t) => t.id === savedTransfer.id);
      const updatedTransfers = exists
        ? prev.transfers.map((t) => (t.id === savedTransfer.id ? savedTransfer : t))
        : [...prev.transfers, savedTransfer];
      return { ...prev, transfers: updatedTransfers };
    });
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };

  // Excursions
  // ✅ Excursions (completo, igual arquitectura que Transfer)
  const handleCreateExcursion = () => {
    setSelectedExcursion(undefined);
    setExcursionDialogOpen(true);
  };

  const handleEditExcursion = (excursion: Record<string, unknown>) => {
    setSelectedExcursion(excursion as unknown as ExcursionType);
    setExcursionDialogOpen(true);
  };

  // 💾 Guardar (creación o edición)
  const handleSaveExcursion = (savedExcursion: ExcursionType) => {
    setReservation((prev) => {
      const exists = prev.excursions.some((e) => e.id === savedExcursion.id);
      const updatedExcursions = exists
        ? prev.excursions.map((e) =>
          e.id === savedExcursion.id ? savedExcursion : e
        )
        : [...prev.excursions, savedExcursion];
      return { ...prev, excursions: updatedExcursions };
    });
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };

  // Medical Assists
  // ✅ Crear
  const handleCreateMedicalAssist = () => {
    setSelectedMedicalAssist(undefined);
    setMedicalAssistDialogOpen(true);
  };

  // ✅ Editar
  const handleEditMedicalAssist = (assist: Record<string, unknown>) => {
    setSelectedMedicalAssist(assist as unknown as MedicalAssistType);
    setMedicalAssistDialogOpen(true);
  };

  // ✅ Guardar (crear o editar)
  const handleSaveMedicalAssist = (savedAssist: MedicalAssistType) => {
    setReservation((prev) => {
      const exists = prev.medicalAssists.some((a) => a.id === savedAssist.id);
      const updatedAssists = exists
        ? prev.medicalAssists.map((a) => (a.id === savedAssist.id ? savedAssist : a))
        : [...prev.medicalAssists, savedAssist];
      return { ...prev, medicalAssists: updatedAssists };
    });
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };

  // 🆕 Car Rentals Handlers
  const handleCreateCarRental = () => {
    setSelectedCarRental(undefined);
    setCarRentalDialogOpen(true);
  };

  const handleEditCarRental = (item: Record<string, unknown>) => {
    setSelectedCarRental(item as unknown as CarRental);
    setCarRentalDialogOpen(true);
  };

  const handleSaveCarRental = (saved: CarRental) => {
    setReservation((prev) => {
      const exists = prev.carRentals?.some((c) => c.id === saved.id);
      const updated = exists
        ? prev.carRentals?.map((c) => (c.id === saved.id ? saved : c))
        : [...(prev.carRentals ?? []), saved];
      return { ...prev, carRentals: updated };
    });
    updateReservationMetadata(); // 🔄 Actualizar auditoría
  };


  // ---------------- Formatters ----------------
  function formatCurrency(
    value?: number | null,
    currency?: string,
  ): string {
    const safeValue = typeof value === "number" ? value : 0;
    // Aseguramos que la moneda sea válida, default a USD
    const safeCurrency =
      currency && typeof currency === "string" && currency.length === 3
        ? currency
        : "USD";

    // ✅ CASO ESPECIAL: Pesos Argentinos
    // Forzamos el prefijo "AR$" formateando como decimal
    if (safeCurrency === "ARS") {
      const number = new Intl.NumberFormat("es-AR", {
        style: "decimal",
        minimumFractionDigits: 2, // Usamos 2 decimales para precisión en tablas
        maximumFractionDigits: 2,
      }).format(safeValue);
      return `AR$ ${number}`;
    }

    // ✅ CASO ESTÁNDAR: USD y otras monedas
    // Usa el formato de moneda nativo (ej: US$ para USD en locale es-AR)
    try {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: safeCurrency,
        minimumFractionDigits: 2,
      }).format(safeValue);
    } catch {
      // Fallback por si la moneda es rara
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

  const planeColumns: Column[] = [
    {
      key: "segments",
      label: "Ruta",
      render: (_value: unknown, row: Record<string, unknown>) => {
        const plane = row as unknown as PlaneType;
        const segs = plane.segments ?? [];
        if (segs.length === 0) {
          return <span className="text-muted-foreground">— Sin tramos —</span>;
        }
        return (
          <div className="text-sm space-y-1">
            {segs.map((s) => (
              <div key={s.segmentOrder} className="flex gap-1">
                <span className="font-medium">{s.departure}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{s.arrival}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "segments",
      label: "Salida / Llegada",
      render: (_value: unknown, row: Record<string, unknown>) => {
        const plane = row as unknown as PlaneType;
        const segs = plane.segments ?? [];
        if (segs.length === 0) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="text-sm space-y-1">
            {segs.map((s) => (
              <div key={s.segmentOrder} className="flex gap-2">
                <span>{fmt(s.departureDate)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{fmt(s.arrivalDate)}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "provider",
      label: "Aerolínea",
    },
    {
      key: "bookingReference",
      label: "Referencia",
    },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_v, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid ?? 0), String(row.currency ?? "USD"))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice ?? 0), String(row.currency ?? "USD"))}
          </div>
        </div>
      ),
    },
  ];

  const cruiseColumns: Column[] = [
    {
      key: "provider",
      label: "Naviera",
    },
    {
      key: "route",
      label: "Ruta",
      render: (_v, row) => {
        const embark = row.embarkationPort as string | undefined
        const arrival = row.arrivalPort as string | undefined
        return embark || arrival ? `${embark ?? "?"} → ${arrival ?? "?"}` : "—"
      },
    },
    {
      key: "startDate",
      label: "Salida / Llegada",
      render: (_v, row) => (
        <div className="text-sm">
          <div>{formatDate(String(row.startDate))}</div>
          <div className="text-muted-foreground">{formatDate(String(row.endDate))}</div>
        </div>
      ),
    },
    {
      key: "bookingReference",
      label: "Referencia",
    },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_v, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid ?? 0), String(row.currency ?? "USD"))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice ?? 0), String(row.currency ?? "USD"))}
          </div>
        </div>
      ),
    },
  ]


  const transferColumns: Column[] = [
    { key: "origin", label: "Origen" },
    { key: "destination", label: "Destino" },
    {
      key: "departureDate",
      label: "Salida / Llegada",
      render: (_value, row) => (
        <div className="text-sm">
          <div>{fmt(String(row.departureDate))}</div>
          <div className="text-muted-foreground">{fmt(String(row.arrivalDate))}</div>
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
    { key: "origin", label: "Lugar / Origen" },
    {
      key: "excursionDate",
      label: "Fecha",
      render: (_value, row) => (
        <div className="text-sm">{fmt(String(row.excursionDate))}</div>
      ),
    },
    { key: "provider", label: "Proveedor" },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid ?? 0), String(row.currency ?? "USD"))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice ?? 0), String(row.currency ?? "USD"))}
          </div>
        </div>
      ),
    },
  ];


  const medicalAssistColumns: Column[] = [
    { key: "provider", label: "Proveedor" },
    {
      key: "assistType",
      label: "Tipo de asistencia",
      render: (_value, row) => <div className="text-sm">{String(row.assistType) || "—"}</div>,
    },
    {
      key: "bookingReference",
      label: "Referencia",
      render: (_value, row) => <div className="text-sm">{String(row.bookingReference) || "—"}</div>,
    },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_value, row) => (
        <div className="text-sm">
          <div className="font-medium">
            {formatCurrency(Number(row.amountPaid ?? 0), String(row.currency ?? "USD"))}
          </div>
          <div className="text-muted-foreground">
            de {formatCurrency(Number(row.totalPrice ?? 0), String(row.currency ?? "USD"))}
          </div>
        </div>
      ),
    },
  ];

  // 🆕 Car Rental Columns
  const carRentalColumns: Column[] = [
    { key: "provider", label: "Proveedor" },
    {
      key: "carCategory",
      label: "Vehículo",
      render: (_v, row) => {
        // ✅ Aserción de tipo segura: row -> unknown -> CarRental
        const item = row as unknown as CarRental;
        return (
          <div className="text-sm">
            <div className="font-medium">{item.carCategory}</div>
            {item.carModel && <div className="text-muted-foreground">{item.carModel}</div>}
          </div>
        )
      }
    },
    {
      key: "pickupDate",
      label: "Retiro / Devolución",
      render: (_v, row) => {
        const item = row as unknown as CarRental;
        return (
          <div className="text-sm">
            <div>{fmt(item.pickupDate)}</div>
            <div className="text-muted-foreground">{fmt(item.dropoffDate)}</div>
          </div>
        )
      },
    },
    {
      key: "pickupLocation",
      label: "Lugar",
      render: (_v, row) => {
        const item = row as unknown as CarRental;
        return (
          <div className="text-sm">
            <div>Ret: {item.pickupLocation}</div>
            <div className="text-muted-foreground">Dev: {item.dropoffLocation}</div>
          </div>
        )
      },
    },
    {
      key: "totalPrice",
      label: "Precio",
      render: (_v, row) => {
        const item = row as unknown as CarRental;
        return (
          <div className="text-sm">
            <div className="font-medium">
              {formatCurrency(Number(item.amountPaid ?? 0), String(item.currency ?? "USD"))}
            </div>
            <div className="text-muted-foreground">
              de {formatCurrency(Number(item.totalPrice ?? 0), String(item.currency ?? "USD"))}
            </div>
          </div>
        )
      },
    },
  ];

  const financialItems = [
    ...reservation.hotels.map((h) => ({
      id: h.id,
      type: "Hotel",
      label: h.hotelName || "Hotel sin nombre",
      totalPrice: Number(h.totalPrice ?? 0),
      amountPaid: Number(h.amountPaid ?? 0),
      currency: h.currency || "USD",
    })),
    ...reservation.planes.map((p) => ({
      id: p.id,
      type: "Vuelo",
      label: p.provider ? `Vuelo: ${p.provider}` : "Vuelo",
      totalPrice: Number(p.totalPrice ?? 0),
      amountPaid: Number(p.amountPaid ?? 0),
      currency: p.currency || "USD",
    })),
    ...reservation.cruises.map((c) => ({
      id: c.id,
      type: "Crucero",
      label: c.provider ? `Crucero: ${c.provider}` : "Crucero",
      totalPrice: Number(c.totalPrice ?? 0),
      amountPaid: Number(c.amountPaid ?? 0),
      currency: c.currency || "USD",
    })),
    ...reservation.transfers.map((t) => ({
      id: t.id,
      type: "Traslado",
      label: `Traslado: ${t.origin} -> ${t.destination}`,
      totalPrice: Number(t.totalPrice ?? 0),
      amountPaid: Number(t.amountPaid ?? 0),
      currency: t.currency || "USD",
    })),
    ...reservation.excursions.map((e) => ({
      id: e.id,
      type: "Excursión",
      label: e.excursionName || "Excursión",
      totalPrice: Number(e.totalPrice ?? 0),
      amountPaid: Number(e.amountPaid ?? 0),
      currency: e.currency || "USD",
    })),
    ...reservation.medicalAssists.map((m) => ({
      id: m.id,
      type: "Asistencia",
      label: m.assistType ? `Asistencia: ${m.assistType}` : "Asistencia Médica",
      totalPrice: Number(m.totalPrice ?? 0),
      amountPaid: Number(m.amountPaid ?? 0),
      currency: m.currency || "USD",
    })),
    ...(reservation.carRentals ?? []).map((c) => ({
      id: c.id,
      type: "Auto",
      label: c.carCategory ? `Auto: ${c.carCategory}` : "Alquiler de Auto",
      totalPrice: Number(c.totalPrice ?? 0),
      amountPaid: Number(c.amountPaid ?? 0),
      currency: c.currency || "USD",
    })),
  ];


  // ---------------- Render ----------------
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/reservas")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </Button>

        <div className="flex flex-col gap-8">

          {/* --- BLOQUE SUPERIOR: Header y Tabs --- */}
          <div className="space-y-6">
            <ReservationDetailHeader
              reservation={reservation}
              onStateChange={handleStateChange}
              onPassengersChange={handlePassengersChange}
              paymentItems={financialItems}
              onNameChange={handleNameChange}
            />

            <Tabs defaultValue="hotels" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="hotels" className="gap-2">
                  <Hotel className="h-4 w-4" /> Hoteles
                </TabsTrigger>
                <TabsTrigger value="planes" className="gap-2">
                  <Plane className="h-4 w-4" /> Vuelos
                </TabsTrigger>
                <TabsTrigger value="cruises" className="gap-2">
                  <Ship className="h-4 w-4" /> Cruceros
                </TabsTrigger>
                <TabsTrigger value="transfers" className="gap-2">
                  <Car className="h-4 w-4" /> Traslados
                </TabsTrigger>
                <TabsTrigger value="carRentals" className="gap-2">
                  <CarFront className="h-4 w-4" /> Autos
                </TabsTrigger>
                <TabsTrigger value="excursions" className="gap-2">
                  <Compass className="h-4 w-4" /> Excursiones
                </TabsTrigger>
                <TabsTrigger value="medical" className="gap-2">
                  <Heart className="h-4 w-4" /> Asistencias
                </TabsTrigger>
              </TabsList>

              {/* ... (Aquí van todos tus TabsContent: hotels, planes, cruises, etc. sin cambios) ... */}

              <TabsContent value="hotels" className="space-y-4">
                <div className="flex mt-2 justify-start">
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

              <TabsContent value="planes" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreatePlane}>Crear Vuelo</Button>
                </div>
                <EntityTable
                  data={reservation.planes as unknown as Record<string, unknown>[]}
                  columns={planeColumns}
                  onEdit={handleEditPlane}
                  onDelete={handleDeletePlaneServer}
                  emptyMessage="No hay vuelos agregados aún"
                />
              </TabsContent>

              <TabsContent value="cruises" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreateCruise}>Crear Crucero</Button>
                </div>
                <EntityTable
                  data={reservation.cruises as unknown as Record<string, unknown>[]}
                  columns={cruiseColumns}
                  onEdit={handleEditCruise}
                  onDelete={handleDeleteCruiseServer}
                  emptyMessage="No hay cruceros agregados aún"
                />
              </TabsContent>

              <TabsContent value="transfers" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreateTransfer}>Crear Traslado</Button>
                </div>
                <EntityTable
                  data={reservation.transfers as unknown as Record<string, unknown>[]}
                  columns={transferColumns}
                  onEdit={handleEditTransfer}
                  onDelete={handleDeleteTransferServer}
                  emptyMessage="No hay traslados agregados aún"
                />
              </TabsContent>

              <TabsContent value="carRentals" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreateCarRental}>Crear Auto</Button>
                </div>
                <EntityTable
                  data={(reservation.carRentals ?? []) as unknown as Record<string, unknown>[]}
                  columns={carRentalColumns}
                  onEdit={handleEditCarRental}
                  onDelete={handleDeleteCarRentalServer}
                  emptyMessage="No hay alquileres de autos agregados aún"
                />
              </TabsContent>

              <TabsContent value="excursions" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreateExcursion}>Crear Excursión</Button>
                </div>
                <EntityTable
                  data={reservation.excursions as unknown as Record<string, unknown>[]}
                  columns={excursionColumns}
                  onEdit={handleEditExcursion}
                  onDelete={handleDeleteExcursionServer}
                  emptyMessage="No hay excursiones agregadas aún"
                />
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <div className="flex mt-2 justify-start">
                  <Button onClick={handleCreateMedicalAssist}>Crear Asistencia</Button>
                </div>
                <EntityTable
                  data={reservation.medicalAssists as unknown as Record<string, unknown>[]}
                  columns={medicalAssistColumns}
                  onEdit={handleEditMedicalAssist}
                  onDelete={handleDeleteMedicalAssistServer}
                  emptyMessage="No hay asistencias agregadas aún"
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* --- BLOQUE INFERIOR: Audit Panel --- */}
          <div className="w-full mt-4 border-t pt-8">
            <h3 className="mb-4 text-lg font-semibold">Historial de Cambios</h3>
            <AuditPanel reservation={reservation} />
          </div>

        </div>
      </div>

      {hotelDialogOpen && (
        <HotelDialog
          key="hotel-dialog"
          open={hotelDialogOpen}
          onOpenChange={setHotelDialogOpen}
          hotel={selectedHotel}
          reservationId={id}
          onSave={handleSaveHotel}
          onDelete={handleDeleteHotelLocal}
        />
      )}
      {planeDialogOpen && (
        <PlaneDialog
          key={selectedPlane?.id ? `edit-${selectedPlane.id}-${selectedPlane.updatedAt}` : 'new-plane'}
          open={planeDialogOpen}
          onOpenChange={setPlaneDialogOpen}
          plane={selectedPlane}
          reservationId={id}
          onSave={handleSavePlane}
          onDelete={handleDeletePlaneLocal}
        />
      )}

      {cruiseDialogOpen && (
        <CruiseDialog
          key="cruise-dialog"
          open={cruiseDialogOpen}
          onOpenChange={setCruiseDialogOpen}
          cruise={selectedCruise}
          reservationId={id}
          onSave={handleSaveCruise}
          onDelete={handleDeleteCruiseLocal}
        />
      )}

      {transferDialogOpen && (
        <TransferDialog
          key="transfer-dialog"
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          transfer={selectedTransfer}
          reservationId={id}
          onSave={handleSaveTransfer}
          onDelete={handleDeleteTransferLocal}
        />
      )}

      {carRentalDialogOpen && (
        <CarRentalDialog
          key="car-rental-dialog"
          open={carRentalDialogOpen}
          onOpenChange={setCarRentalDialogOpen}
          carRental={selectedCarRental}
          reservationId={id}
          onSave={handleSaveCarRental}
          onDelete={handleDeleteCarRentalLocal}
        />
      )}

      {excursionDialogOpen && (
        <ExcursionDialog
          key="excursion-dialog"
          open={excursionDialogOpen}
          onOpenChange={setExcursionDialogOpen}
          excursion={selectedExcursion}
          reservationId={id}
          onSave={handleSaveExcursion}
          onDelete={handleDeleteExcursionLocal}
        />
      )}

      {medicalAssistDialogOpen && (
        <MedicalAssistDialog
          key="medical-assist-dialog"
          open={medicalAssistDialogOpen}
          onOpenChange={setMedicalAssistDialogOpen}
          assist={selectedMedicalAssist}
          reservationId={id}
          onSave={handleSaveMedicalAssist}
          onDelete={handleDeleteMedicalAssistLocal}
        />
      )}
    </DashboardLayout>
  );
}