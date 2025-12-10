import type React from "react"
import { useState } from "react" // 1. Importar useState
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// 2. Importar componentes de AlertDialog
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

export interface Column {
  key: string
  label: string
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
}

interface EntityTableProps {
  data: Record<string, unknown>[]
  columns: Column[]
  onEdit: (item: Record<string, unknown>) => void
  onDelete: (id: string) => void
  emptyMessage?: string
}

export function EntityTable({
  data,
  columns,
  onEdit,
  onDelete,
  emptyMessage = "No hay datos",
}: EntityTableProps) {
  // 3. Estado para controlar qué ID se está intentando eliminar
  // Si es null, el modal está cerrado. Si tiene un string, el modal está abierto.
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "—"
    return format(date, "dd MMM yyyy", { locale: es })
  }

  const defaultRender = (value: unknown, key: string): React.ReactNode => {
    if (value === null || value === undefined || value === "") return "—"
    if (key.toLowerCase().includes("date") && typeof value === "string") return formatDate(value)
    if (typeof value === "number" && key.toLowerCase().includes("price")) {
      return value.toLocaleString("es-AR", { minimumFractionDigits: 2 })
    }
    return String(value)
  }

  const filteredData = Array.isArray(data)
    ? data.filter((item) => {
      if (!item || typeof item !== "object") return false
      const hasValidId = item.id && String(item.id).trim() !== ""
      return hasValidId
    })
    : []

  const noData = filteredData.length === 0

  // 4. Función que ejecuta la eliminación real
  const confirmDelete = () => {
    if (itemToDelete) {
      onDelete(itemToDelete)
      setItemToDelete(null) // Cerramos el modal / limpiamos el estado
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border md:border-border bg-card w-full overflow-x-auto">
        <Table className="min-w-[800px] w-full">
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap px-4">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-right whitespace-nowrap px-4">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noData ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, idx) => (
                <TableRow key={`${String(item.id)}-${idx}`}>
                  {columns.map((col) => {
                    const value = item[col.key]
                    return (
                      <TableCell key={col.key} className="whitespace-nowrap px-4">
                        {col.render
                          ? col.render(value ?? "—", item)
                          : defaultRender(value, col.key)}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right whitespace-nowrap px-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(item)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        className="cursor-pointer"
                        variant="ghost"
                        size="icon"
                        // 5. CAMBIO AQUÍ: En lugar de onDelete directo, guardamos el ID en el estado
                        onClick={() => setItemToDelete(String(item.id))}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 6. Componente de Alerta al final */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro seleccionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
                className="cursor-pointer" 
                onClick={() => setItemToDelete(null)}
            >
                Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}