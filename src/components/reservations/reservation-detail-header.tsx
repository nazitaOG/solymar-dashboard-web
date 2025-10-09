import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Users } from "lucide-react"
import { EditPassengersDialog } from "./edit-passengers-dialog"
import type { ReservationDetail, ReservationState, Pax } from "@/lib/types"

interface ReservationDetailHeaderProps {
  reservation: ReservationDetail
  availablePassengers: Pax[]
  onStateChange: (state: ReservationState) => void
  onPassengersChange: (passengers: Pax[]) => void
}

export function ReservationDetailHeader({
  reservation,
  availablePassengers,
  onStateChange,
  onPassengersChange,
}: ReservationDetailHeaderProps) {
  const [editPassengersOpen, setEditPassengersOpen] = useState(false)

  const getStateBadge = (state: ReservationState) => {
    const variants = {
      PENDING: { label: "Pendiente", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      CONFIRMED: { label: "Confirmada", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      CANCELLED: { label: "Cancelada", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    }
    return variants[state]
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const currentPassengers = reservation.paxReservations.map((pr) => pr.pax)

  return (
    <>
      <div className="space-y-6">
        {/* Header with ID and State */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight font-mono">{reservation.id}</h1>
            <Select value={reservation.state} onValueChange={(value) => onStateChange(value as ReservationState)}>
              <SelectTrigger className="w-[180px] bg-transparent">
                <Badge className={getStateBadge(reservation.state).className}>
                  {getStateBadge(reservation.state).label}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Currency Totals */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reservation.currencyTotals.map((ct, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{ct.currency}</p>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold">{formatCurrency(ct.amountPaid, ct.currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      de {formatCurrency(ct.totalPrice, ct.currency)} total
                    </p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(ct.amountPaid / ct.totalPrice) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Passengers */}
        <div className="flex items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {currentPassengers.map((passenger) => (
              <Badge key={passenger.id} variant="outline" className="gap-2 py-1.5">
                <Users className="h-3 w-3" />
                {passenger.name}
              </Badge>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditPassengersOpen(true)}>
            Editar pasajeros
          </Button>
        </div>
      </div>

      <EditPassengersDialog
        open={editPassengersOpen}
        onOpenChange={setEditPassengersOpen}
        currentPassengers={currentPassengers}
        availablePassengers={availablePassengers}
        onSave={onPassengersChange}
      />
    </>
  )
}
