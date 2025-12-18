import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { Save, Loader2 } from "lucide-react"; // Agregué Loader para feedback visual si quieres

interface ReservationNotesProps {
  notes?: string | null;
  onSave: (notes: string) => void;
  disabled?: boolean;
}

export function ReservationNotes({ notes, onSave, disabled }: ReservationNotesProps) {
  // 1. Estado local inicializado con la prop
  const [value, setValue] = useState(notes ?? "");

  // 2. ✨ LA CLAVE: Sincronización con el padre.
  // Cuando el padre (ReservationDetailPage) termina de hacer el fetch o el update,
  // la prop 'notes' cambia. Este useEffect detecta ese cambio y actualiza el estado local 'value'.
  // Esto hace que el botón vuelva a estado "Guardado" automáticamente.
  useEffect(() => {
    setValue(notes ?? "");
  }, [notes]);

  // Detectar si hay cambios pendientes
  // Compara lo que escribió el usuario (value) contra lo que dice la base de datos (notes)
  const isDirty = value !== (notes ?? "");

  const handleSave = () => {
    // Evitamos guardar si no hay cambios o si está deshabilitado (cargando)
    if (isDirty && !disabled) {
      onSave(value);
    }
  };

  const handleBlur = () => {
    if (isDirty && !disabled) {
      onSave(value);
    }
  };

  return (
    <div className="w-full space-y-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-none tracking-tight">Notas</h3>
          <p className="text-sm text-muted-foreground">
            Agrega anotaciones y observaciones sobre la reserva.
          </p>
        </div>
        
        <Button 
          size="sm" 
          onClick={handleSave} 
          // Se deshabilita si: No hay cambios, O si el padre dice que está cargando (disabled)
          disabled={!isDirty || disabled}
          className={cn(
            "gap-2 transition-all cursor-pointer",
            !isDirty && "opacity-80" // Un poco de estilo visual cuando está guardado
          )}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {disabled ? "Guardando..." : isDirty ? "Guardar cambios" : "Guardado"}
        </Button>
      </div>
      
      <div className="pt-2">
        <div className={cn(
          "rounded-md border bg-muted/20 p-2 transition-all",
          "focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
          // Feedback visual: borde amarillo si hay cambios sin guardar
          isDirty && "border-yellow-400/50 bg-yellow-50/10"
        )}>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder="Escribe tus notas aquí..."
            className={cn(
              "min-h-[100px] w-full resize-y border-none bg-transparent p-2 focus-visible:ring-0 shadow-none text-sm leading-relaxed",
              "placeholder:text-muted-foreground/70"
            )}
          />
        </div>
        {/* Texto de estado */}
        <div className="mt-2 h-4 flex justify-end">
            {isDirty && !disabled && (
                <span className="text-[10px] text-muted-foreground italic animate-pulse">
                    Hay cambios sin guardar...
                </span>
            )}
        </div>
      </div>
    </div>
  );
}