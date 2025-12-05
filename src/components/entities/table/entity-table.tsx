import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// ... (Interfaces Column y Props iguales) ...
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

  return (
    <div className="w-full">
      {/* SIN max-w acá */}
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
    </div>
  )
}
