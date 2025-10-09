import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search } from "lucide-react"

interface PassengerFiltersProps {
  onFilterChange: (filters: { search: string; nationality?: string; documentFilter?: string }) => void
}

export function PassengerFilters({ onFilterChange }: PassengerFiltersProps) {
  const [search, setSearch] = useState("")
  const [nationality, setNationality] = useState<string>()
  const [documentFilter, setDocumentFilter] = useState<string>()

  const handleApplyFilters = () => {
    onFilterChange({ search, nationality, documentFilter })
  }

  const handleClearFilters = () => {
    setSearch("")
    setNationality(undefined)
    setDocumentFilter(undefined)
    onFilterChange({ search: "" })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">Filtros</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar por nombre</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre del pasajero..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Nationality */}
        <div className="space-y-2">
          <Label>Nacionalidad</Label>
          <Select value={nationality} onValueChange={setNationality}>
            <SelectTrigger className="bg-transparent">
              <SelectValue placeholder="Todas las nacionalidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Argentina">Argentina</SelectItem>
              <SelectItem value="Uruguay">Uruguay</SelectItem>
              <SelectItem value="Chile">Chile</SelectItem>
              <SelectItem value="Brasil">Brasil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document Filter */}
        <div className="space-y-2">
          <Label>Documento</Label>
          <Select value={documentFilter} onValueChange={setDocumentFilter}>
            <SelectTrigger className="bg-transparent">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="with-dni">Con DNI</SelectItem>
              <SelectItem value="with-passport">Con Pasaporte</SelectItem>
              <SelectItem value="without-documents">Sin documentos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          Aplicar filtros
        </Button>
        <Button onClick={handleClearFilters} variant="outline" size="sm">
          Limpiar
        </Button>
      </div>
    </div>
  )
}
