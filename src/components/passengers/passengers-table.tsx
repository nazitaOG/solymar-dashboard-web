import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  
  // 👇 Estado para controlar el diálogo de eliminación
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null)

  const { deletePassenger, isPending, error } = useDeletePassenger({
    onDeleteSuccess: (id) => {
      onDelete(id)
      setDeleteTarget(null) // Cerrar diálogo al terminar
    },
  })

  // Paginación
  const totalPages = Math.ceil(passengers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPassengers = passengers.slice(startIndex, endIndex)

  const getDocumentInfo = (passenger: Pax) => {
    if (passenger.dni && passenger.passport) {
      return (
        <div className="space-y-1">
          <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
            DNI: {passenger.dni.dniNum}
          </Badge>
          <div className="pt-1">
            <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
              Pasaporte: {passenger.passport.passportNum}
            </Badge>
          </div>
        </div>
      )
    }
    if (passenger.dni) {
      return (
        <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
          DNI: {passenger.dni.dniNum}
        </Badge>
      )
    }
    if (passenger.passport) {
      return (
        <Badge variant="outline" className="text-[10px] md:text-xs whitespace-nowrap">
          Pasaporte: {passenger.passport.passportNum}
        </Badge>
      )
    }
    return (
      <span className="text-[10px] md:text-sm text-muted-foreground whitespace-nowrap">
        Sin documento
      </span>
    )
  }

  // 👇 Handler para el botón de confirmar borrado
  const confirmDelete = () => {
    if (deleteTarget) {
      deletePassenger(deleteTarget.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Wrapper Grid */}
      <div className="grid grid-cols-1 w-full">
        {/* 2. Wrapper Scroll */}
        <div className="rounded-lg border border-border bg-card overflow-x-auto w-full max-w-full">
          {/* 3. Tabla */}
          <Table className="min-w-[600px] md:min-w-[1000px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4">Nombre</TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4">Fecha de nacimiento</TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4">Nacionalidad</TableHead>
                <TableHead className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4">Documento</TableHead>
                <TableHead className="text-right whitespace-nowrap text-xs md:text-sm px-2 md:px-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPassengers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <p className="text-muted-foreground text-xs md:text-sm">
                      No se encontraron pasajeros
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                currentPassengers.map((passenger) => (
                  <TableRow
                    key={passenger.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <TableCell className="font-medium whitespace-nowrap text-xs md:text-sm px-2 md:px-4">
                      {passenger.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs md:text-sm px-2 md:px-4">
                      {format(new Date(passenger.birthDate), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs md:text-sm px-2 md:px-4">
                      {passenger.nationality}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-2 md:px-4">
                      {getDocumentInfo(passenger)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap px-2 md:px-4">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onView(passenger)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(passenger)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            // 👇 Abre el diálogo
                            setDeleteTarget({ id: passenger.id, name: passenger.name })
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
      </div>

      {/* Error visual si falla eliminación */}
      {error && (
        <p className="text-xs md:text-sm text-red-500 text-center mt-2 font-medium">
          {error}
        </p>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs md:text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {startIndex + 1} a {Math.min(endIndex, passengers.length)} de{" "}
            {passengers.length} pasajeros
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 text-xs md:text-sm cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 text-xs md:text-sm cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 👇 DIÁLOGO DE CONFIRMACIÓN DE BORRADO */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al pasajero{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>
              . No podrás deshacer esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 cursor-pointer text-white"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}