import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Pax } from "@/lib/interfaces/pax/pax.interface"
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger"

interface PassengersTableProps {
  passengers: Pax[]
  onView: (passenger: Pax) => void
  onEdit: (passenger: Pax) => void
  onDelete: (id: string) => void
}

const ITEMS_PER_PAGE = 10

export function PassengersTable({
  passengers,
  onView,
  onEdit,
  onDelete,
}: PassengersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // hook unificado
  const { deletePassenger, isPending, error } = useDeletePassenger({
    onDeleteSuccess: onDelete,
  })

  const totalPages = Math.ceil(passengers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPassengers = passengers.slice(startIndex, endIndex)

  const getDocumentInfo = (passenger: Pax) => {
    if (passenger.dni && passenger.passport) {
      return (
        <div className="space-y-1">
          <Badge variant="outline" className="text-xs">
            DNI: {passenger.dni.dniNum}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Pasaporte: {passenger.passport.passportNum}
          </Badge>
        </div>
      )
    }
    if (passenger.dni) {
      return (
        <Badge variant="outline" className="text-xs">
          DNI: {passenger.dni.dniNum}
        </Badge>
      )
    }
    if (passenger.passport) {
      return (
        <Badge variant="outline" className="text-xs">
          Pasaporte: {passenger.passport.passportNum}
        </Badge>
      )
    }
    return <span className="text-sm text-muted-foreground">Sin documento</span>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha de nacimiento</TableHead>
              <TableHead>Nacionalidad</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPassengers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <p className="text-muted-foreground">No se encontraron pasajeros</p>
                </TableCell>
              </TableRow>
            ) : (
              currentPassengers.map((passenger) => (
                <TableRow
                  key={passenger.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onView(passenger)}
                >
                  <TableCell className="font-medium">{passenger.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(passenger.birthDate), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{passenger.nationality}</TableCell>
                  <TableCell>{getDocumentInfo(passenger)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onView(passenger)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(passenger)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePassenger(passenger.id, passenger.name)
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Error visual si falla eliminación */}
      {error && (
        <p className="text-sm text-red-500 text-center mt-2">
          {error}
        </p>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, passengers.length)} de {passengers.length} pasajeros
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
