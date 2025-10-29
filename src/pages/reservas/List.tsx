import { useState, useEffect, useTransition, Suspense } from "react"
import { useNavigate, Outlet } from "react-router"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ReservationFilters } from "@/components/reservations/reservation-filters"
import { ReservationsTable } from "@/components/reservations/reservations-table"
import { CreateReservationDialog } from "@/components/reservations/create-reservation-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FullPageLoader } from "@/components/FullPageLoader"

import { fetchAPI } from "@/lib/api/fetchApi"

import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface"
import type { PaginatedResponse } from "@/lib/interfaces/api.interface"
import type { Pax } from "@/lib/interfaces/pax/pax.interface"
import type { ReservationFilters as Filters, ReservationState } from "@/lib/interfaces/reservation/reservation.interface"

export default function ReservasPage() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [passengers, setPassengers] = useState<Pax[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 🧭 Fetch inicial de reservas y pasajeros
  useEffect(() => {
    startTransition(async () => {
      try {
        const [reservationsRes, passengersData] = await Promise.all([
          fetchAPI<PaginatedResponse<Reservation>>("/reservations"),
          fetchAPI<Pax[]>("/pax"),
        ])

        console.log(passengersData)
        console.log(reservationsRes)
        const reservationsData = reservationsRes.data
        setReservations(reservationsData)
        setFilteredReservations(reservationsData)
        setPassengers(passengersData)
      } catch (error) {
        console.error("Error al obtener datos:", error)
      }
    })
  }, [])

  // 🎛️ Filtros locales
  const handleFilterChange = (filters: Filters) => {
    let filtered = [...reservations]

    if (filters.passengerNames?.length) {
      filtered = filtered.filter((r) =>
        r.paxReservations.some((pr) =>
          filters.passengerNames!.some((name) =>
            pr.pax.name.toLowerCase().includes(name.toLowerCase())
          )
        )
      )
    }

    if (filters.states?.length) {
      filtered = filtered.filter((r) => filters.states!.includes(r.state))
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((r) => new Date(r.createdAt) >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      filtered = filtered.filter((r) => new Date(r.createdAt) <= filters.dateTo!)
    }

    if (filters.currency) {
      filtered = filtered.filter((r) =>
        r.currencyTotals.some((ct) => ct.currency === filters.currency)
      )
    }

    if (filters.sortBy === "newest") {
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (filters.sortBy === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }

    setFilteredReservations(filtered)
  }

  // ➕ Crear reserva
  const handleCreateReservation = async (data: { state: ReservationState; passengers: Pax[] }) => {
    try {
      const body = {
        state: data.state,
        paxIds: data.passengers.map((p) => p.id),
      }

      const newReservation = await fetchAPI<Reservation>("/reservations", {
        method: "POST",
        body: JSON.stringify(body),
      })

      setReservations((prev) => [newReservation, ...prev])
      setFilteredReservations((prev) => [newReservation, ...prev])
      navigate(`/reservas/${newReservation.id}`)
    } catch (error) {
      console.error("Error al crear reserva:", error)
    }
  }

  // 🧩 Render principal
  return (
    <DashboardLayout onCreateReservation={() => setCreateDialogOpen(true)}>
      <Suspense fallback={<FullPageLoader />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
              <p className="text-muted-foreground">Administra todas las reservas de viajes</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" disabled={isPending}>
              <Plus className="h-4 w-4" />
              {isPending ? "Cargando..." : "Crear Reserva"}
            </Button>
          </div>

          {/* ✅ Ahora pasa el array de pasajeros correctamente */}
          <ReservationFilters passengers={passengers} onFilterChange={handleFilterChange} />
          <ReservationsTable reservations={filteredReservations} />
        </div>

        <CreateReservationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          availablePassengers={passengers}
          onCreate={handleCreateReservation}
        />

        <Outlet />
      </Suspense>
    </DashboardLayout>
  )
}
