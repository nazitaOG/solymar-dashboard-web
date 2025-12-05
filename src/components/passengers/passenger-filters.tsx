import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter, Search } from "lucide-react"

interface PassengerFiltersProps {
  onFilterChange: (filters: {
    search: string
    nationality?: string
    documentFilter?: string
  }) => void
}

export function PassengerFilters({ onFilterChange }: PassengerFiltersProps) {
  const [search, setSearch] = useState("")
  const [nationality, setNationality] = useState<string>("all")
  const [documentFilter, setDocumentFilter] = useState<string>("all")

  // 🔎 Aplicar filtros
  const handleApplyFilters = () => {
    onFilterChange({
      search,
      nationality: nationality === "all" ? undefined : nationality.toUpperCase(),
      documentFilter: documentFilter === "all" ? undefined : documentFilter,
    })
  }

  // 🧹 Limpiar filtros
  const handleClearFilters = () => {
    setSearch("")
    setNationality("all")
    setDocumentFilter("all")
    onFilterChange({ search: "" })
  }

  return (
    <div className="space-y-4 w-full md:w-fit rounded-lg border border-border bg-card p-3 md:p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm md:text-base">Filtros</h3>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {/* 🔍 Buscar por nombre */}
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="search" className="text-xs md:text-sm">Buscar por nombre</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 md:h-4 md:w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre del pasajero..."
              // h-8 en móvil (compacto), h-10 en desktop (estándar)
              className="pl-8 md:pl-9 h-8 md:h-10 text-xs md:text-sm"
            />
          </div>
        </div>

        {/* 🌎 Nacionalidad */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Nacionalidad</Label>
          <Select value={nationality} onValueChange={setNationality}>
            <SelectTrigger className="bg-transparent h-8 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Todas las nacionalidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs md:text-sm">Todas las nacionalidades</SelectItem>
              <SelectItem value="Argentina" className="text-xs md:text-sm">Argentina</SelectItem>
              <SelectItem value="Uruguay" className="text-xs md:text-sm">Uruguay</SelectItem>
              <SelectItem value="Chile" className="text-xs md:text-sm">Chile</SelectItem>
              <SelectItem value="Brasil" className="text-xs md:text-sm">Brasil</SelectItem>
              <SelectItem value="Paraguay" className="text-xs md:text-sm">Paraguay</SelectItem>
              <SelectItem value="Perú" className="text-xs md:text-sm">Perú</SelectItem>
              <SelectItem value="Bolivia" className="text-xs md:text-sm">Bolivia</SelectItem>
              <SelectItem value="Otro" className="text-xs md:text-sm">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 🪪 Documento */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Documento</Label>
          <Select value={documentFilter} onValueChange={setDocumentFilter}>
            <SelectTrigger className="bg-transparent h-8 md:h-10 text-xs md:text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs md:text-sm">Todos</SelectItem>
              <SelectItem value="with-dni" className="text-xs md:text-sm">Con DNI</SelectItem>
              <SelectItem value="with-passport" className="text-xs md:text-sm">Con Pasaporte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleApplyFilters} 
          size="sm" 
          className="h-8 md:h-9 text-xs md:text-sm"
        >
          Aplicar filtros
        </Button>
        <Button 
          onClick={handleClearFilters} 
          variant="outline" 
          size="sm" 
          className="h-8 md:h-9 text-xs md:text-sm"
        >
          Limpiar
        </Button>
      </div>
    </div>
  )
}