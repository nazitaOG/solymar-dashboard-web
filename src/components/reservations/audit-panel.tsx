import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, User } from "lucide-react"
import type { ReservationDetail } from "@/lib/interfaces/reservation/reservation.interface"

interface AuditPanelProps {
  reservation: ReservationDetail
}

export function AuditPanel({ reservation }: AuditPanelProps) {
  // 🧩 Función segura para formatear fechas
  const safeFormat = (date?: string | Date | null) => {
    if (!date) return "—"
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      console.warn("[AuditPanel] ⚠️ Fecha inválida:", date)
      return "—"
    }
    return format(parsed, "dd MMM yyyy, HH:mm", { locale: es })
  }

  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle className="text-base">Auditoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Creación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Creada</span>
          </div>
          <p className="text-sm font-medium">{safeFormat(reservation.createdAt)}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Por</span>
          </div>
          <p className="text-sm font-medium">{reservation.createdBy ?? "—"}</p>
        </div>

        {/* Actualización */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última actualización</span>
          </div>
          <p className="text-sm font-medium">{safeFormat(reservation.updatedAt)}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Por</span>
          </div>
          <p className="text-sm font-medium">{reservation.updatedBy ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  )
}
