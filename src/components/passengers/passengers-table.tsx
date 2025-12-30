import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
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

interface PassengersTableProps {
  passengers: Pax[]
  onView: (passenger: Pax) => void
  onEdit: (passenger: Pax) => void
  onDelete: (id: string) => void
  isDeletingId?: string | null
  externalError?: string | null // 👈 Agregamos esta prop para recibir el error del padre
}

const ITEMS_PER_PAGE = 10

export function PassengersTable({
  passengers,
  onView,
  onEdit,
  onDelete,
  isDeletingId,
  externalError // 👈 La desestructuramos acá
}: PassengersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null)

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

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 w-full">
        <div className="rounded-lg border border-border bg-card overflow-x-auto w-full max-w-full">
          <Table className="min-w-[600px] md:min-w-[1000px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="px-2 md:px-4 text-xs md:text-sm">Nombre</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm">Fecha de nacimiento</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm">Nacionalidad</TableHead>
                <TableHead className="px-2 md:px-4 text-xs md:text-sm">Documento</TableHead>
                <TableHead className="px-2 md:px-4 text-right text-xs md:text-sm">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPassengers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs md:text-sm">
                    No se encontraron pasajeros
                  </TableCell>
                </TableRow>
              ) : (
                currentPassengers.map((passenger) => (
                  <TableRow key={passenger.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="px-2 md:px-4 font-medium text-xs md:text-sm">{passenger.name}</TableCell>
                    <TableCell className="px-2 md:px-4 text-muted-foreground text-xs md:text-sm">
                      {format(new Date(passenger.birthDate), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="px-2 md:px-4 text-xs md:text-sm">{passenger.nationality}</TableCell>
                    <TableCell className="px-2 md:px-4">{getDocumentInfo(passenger)}</TableCell>
                    <TableCell className="px-2 md:px-4 text-right">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={() => onView(passenger)}
                        >
                          <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer"
                          onClick={() => onEdit(passenger)}
                        >
                          <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeletingId === passenger.id}
                          className="h-7 w-7 md:h-9 md:w-9 cursor-pointer text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: passenger.id, name: passenger.name })
                          }}
                        >
                          {isDeletingId === passenger.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          )}
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

      {/* ✅ SECCIÓN DE ERROR: Se muestra acá abajo sin el recuadro redondeado */}
      {externalError && (
        <div className="flex items-center justify-center gap-2 py-2 animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-xs md:text-sm text-destructive font-bold">
            {externalError}
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted-foreground text-center sm:text-left text-xs md:text-sm">
            Mostrando {startIndex + 1} a {Math.min(endIndex, passengers.length)} de{" "}
            {passengers.length} pasajeros
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 cursor-pointer text-xs md:text-sm"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 cursor-pointer text-xs md:text-sm"
            >
              Siguiente <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al pasajero{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}