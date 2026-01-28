import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils/class_value.utils";
// Opciones estáticas
const nationalityOptions = [
  { value: "ARGENTINA", label: "Argentina" },
  { value: "URUGUAY", label: "Uruguay" },
  { value: "CHILE", label: "Chile" },
  { value: "BRASIL", label: "Brasil" },
  { value: "PARAGUAY", label: "Paraguay" },
  { value: "BOLIVIA", label: "Bolivia" },
  { value: "PERU", label: "Perú" },
  { value: "OTHER", label: "Otro" },
];

const docOptions = [
  { value: "with-dni", label: "Con DNI" },
  { value: "with-passport", label: "Con Pasaporte" },
];

// 🚀 CAMBIO: Borramos la interfaz de props y los argumentos de la función.
// Ahora el componente no recibe nada, se maneja solo con la URL.
export default function PassengerFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. ESTADO LOCAL
  const [localName, setLocalName] = useState(searchParams.get("name") || "");
  const [selectedNationality, setSelectedNationality] = useState<string | undefined>(
    searchParams.get("nationality") || undefined
  );
  const [selectedDoc, setSelectedDoc] = useState<string | undefined>(
    searchParams.get("documentFilter") || undefined
  );

  // Estados de los Popovers
  const [openNationality, setOpenNationality] = useState(false);
  const [openDoc, setOpenDoc] = useState(false);

  // 2. APLICAR FILTROS
  const handleApplyFilters = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams();

      // Mantenemos limit si existe
      if (prev.get("limit")) newParams.set("limit", prev.get("limit")!);

      // Name
      if (localName.trim()) newParams.set("name", localName.trim());

      // Nacionalidad
      if (selectedNationality) newParams.set("nationality", selectedNationality);

      // Documento
      if (selectedDoc) newParams.set("documentFilter", selectedDoc);

      // Reset a página 1
      newParams.set("page", "1");
      return newParams;
    });
  };

  // 3. LIMPIAR FILTROS
  const handleClearFilters = () => {
    setLocalName("");
    setSelectedNationality(undefined);
    setSelectedDoc(undefined);

    setSearchParams((prev) => {
      const newParams = new URLSearchParams();
      if (prev.get("limit")) newParams.set("limit", prev.get("limit")!);
      return newParams;
    });
  };

  // Toggles para Badges
  const clearName = () => setLocalName("");
  const clearNationality = () => setSelectedNationality(undefined);
  const clearDoc = () => setSelectedDoc(undefined);

  return (
    <div className="space-y-4 w-full rounded-lg border border-border bg-card p-3 md:p-4">

      {/* Título */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm md:text-base">Filtros</h3>
      </div>

      {/* Grid Responsiva */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">

        {/* 1. INPUT NOMBRE */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Buscar por nombre</Label>
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Nombre del pasajero..."
            className="h-8 md:h-10 text-xs md:text-sm bg-transparent w-full"
          />
        </div>

        {/* 2. NACIONALIDAD */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Nacionalidad</Label>
          <Popover open={openNationality} onOpenChange={setOpenNationality}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-transparent h-8 md:h-10 text-xs md:text-sm px-3 font-normal cursor-pointer"
              >
                <span className="truncate">
                  {selectedNationality
                    ? nationalityOptions.find((n) => n.value === selectedNationality)?.label
                    : "Todas las nacionalidades"}
                </span>
                <Filter className="ml-2 h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command className="w-full">
                <CommandInput placeholder="Buscar nacionalidad..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No encontrada.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => { setSelectedNationality(undefined); setOpenNationality(false); }}
                      className="text-xs md:text-sm cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", !selectedNationality ? "opacity-100" : "opacity-0")} />
                      Todas
                    </CommandItem>
                    {nationalityOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          setSelectedNationality(prev => prev === option.value ? undefined : option.value);
                          setOpenNationality(false);
                        }}
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 md:h-4 md:w-4",
                            selectedNationality === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* 3. DOCUMENTO */}
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-xs md:text-sm">Documento</Label>
          <Popover open={openDoc} onOpenChange={setOpenDoc}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-transparent h-8 md:h-10 text-xs md:text-sm px-3 font-normal cursor-pointer"
              >
                <span className="truncate">
                  {selectedDoc
                    ? docOptions.find((d) => d.value === selectedDoc)?.label
                    : "Todos los documentos"}
                </span>
                <Filter className="ml-2 h-3 w-3 md:h-4 md:w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command className="w-full">
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => { setSelectedDoc(undefined); setOpenDoc(false); }}
                      className="text-xs md:text-sm cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", !selectedDoc ? "opacity-100" : "opacity-0")} />
                      Todos
                    </CommandItem>
                    {docOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          setSelectedDoc(prev => prev === option.value ? undefined : option.value);
                          setOpenDoc(false);
                        }}
                        className="text-xs md:text-sm cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3.5 w-3.5 md:h-4 md:w-4",
                            selectedDoc === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Badges */}
      {(localName || selectedNationality || selectedDoc) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {localName && (
            <Badge variant="secondary" className="gap-1 text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6 pr-0.5">
              Nombre: {localName}
              {/* 🚀 CORRECCIÓN: Botón explícito para asegurar el click */}
              <button
                type="button"
                onClick={clearName}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedNationality && (
            <Badge variant="secondary" className="gap-1 text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6 pr-0.5">
              {nationalityOptions.find((o) => o.value === selectedNationality)?.label}
              <button
                type="button"
                onClick={clearNationality}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedDoc && (
            <Badge variant="secondary" className="gap-1 text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6 pr-0.5">
              {docOptions.find((o) => o.value === selectedDoc)?.label}
              <button
                type="button"
                onClick={clearDoc}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleApplyFilters}
          size="sm"
          className="h-8 md:h-9 text-xs md:text-sm px-6 cursor-pointer"
        >
          Aplicar filtros
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="h-8 md:h-9 text-xs md:text-sm px-6 cursor-pointer"
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}