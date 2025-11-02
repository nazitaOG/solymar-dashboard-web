import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

/**
 * ✅ EntityTable con:
 * - Filtrado basado solo en ID (más confiable)
 * - Fallbacks seguros para valores null/undefined
 * - Debug logs para troubleshooting
 */
export function EntityTable({
  data,
  columns,
  onEdit,
  onDelete,
  emptyMessage = "No hay datos",
}: EntityTableProps) {
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

  // 🔑 Filtrado seguro: Solo verificamos que sea un objeto válido con ID
  const filteredData = Array.isArray(data)
    ? data.filter((item) => {
        if (!item || typeof item !== 'object') return false
        const hasValidId = item.id && String(item.id).trim() !== ""
        return hasValidId
      })
    : []
  
    console.log("🟨 EntityTable data filtrada:", filteredData)

  // Debug solo si hay problemas (comentar en producción)
  // console.log("🔍 EntityTable data recibida:", data)
  // console.log("✅ EntityTable data filtrada:", filteredData)

  const noData = filteredData.length === 0

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className="whitespace-nowrap">
                {col.label}
              </TableHead>
            ))}
            <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
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
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(value ?? "—", item)
                        : defaultRender(value, col.key)}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(String(item.id))}
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
  )
}