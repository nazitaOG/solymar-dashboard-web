import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { DateRange } from "react-day-picker"; // Importante para el tipado

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Definimos las props extendidas para soportar rango
interface DateTimePickerProps {
  // Modo simple
  date?: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  
  // Modo rango
  dateRange?: DateRange | undefined;
  setDateRange?: (range: DateRange | undefined) => void;
  withRange?: boolean;

  label?: string;
  includeTime?: boolean;
}

// -----------------------------------------------------------------------------
// Componente Auxiliar: Input de Tiempo Controlado
// -----------------------------------------------------------------------------
interface TimePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: "hours" | "minutes";
  date: Date | undefined;
  onDateChange: (date: Date) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, picker, date, onDateChange, onRightFocus, onLeftFocus, onFocus, onBlur, ...props }, ref) => {
    const [hasFocus, setHasFocus] = React.useState(false);

    const getDateValue = React.useCallback(() => {
        if (!date) return "00";
        const val = picker === "hours" 
            ? (date.getHours() % 12 || 12) 
            : date.getMinutes();
        return val.toString().padStart(2, "0");
    }, [date, picker]);

    const [localValue, setLocalValue] = React.useState(getDateValue());

    React.useEffect(() => {
        if (!hasFocus) {
            setLocalValue(getDateValue());
        }
    }, [date, getDateValue, hasFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v === "") {
        setLocalValue("");
        return;
      }
      if (!/^\d+$/.test(v)) return;

      const intVal = parseInt(v, 10);
      if (picker === "hours" && intVal > 12) return;
      if (picker === "minutes" && intVal > 59) return;

      setLocalValue(v);

      if (date) {
        const newDate = new Date(date);
        if (picker === "hours") {
          const isPm = newDate.getHours() >= 12;
          let hours = intVal;
          if (hours === 12) hours = 0;
          if (isPm) hours += 12;
          newDate.setHours(hours % 24);
        } else {
          newDate.setMinutes(intVal % 60);
        }
        onDateChange(newDate);
      }

      if (picker === "hours" && v.length === 2) {
        onRightFocus?.();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setHasFocus(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setHasFocus(false);
        setLocalValue(getDateValue());
        if (onBlur) onBlur(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      if (["Tab", "Backspace", "Delete", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn("w-[48px] text-center font-mono text-base p-0 h-8 focus:ring-0 focus-visible:ring-1", className)}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={!date} 
        {...props}
      />
    );
  }
);
TimePickerInput.displayName = "TimePickerInput";

// -----------------------------------------------------------------------------
// Componente Auxiliar: Botones Up/Down
// -----------------------------------------------------------------------------
const TimePeriod = ({
  onUp,
  onDown,
  disabled,
  children,
}: {
  onUp: () => void;
  onDown: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col items-center gap-1">
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onUp} disabled={disabled}>
      <ChevronUp className="h-4 w-4" />
    </Button>
    {children}
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDown} disabled={disabled}>
      <ChevronDown className="h-4 w-4" />
    </Button>
  </div>
);

// -----------------------------------------------------------------------------
// Componente Principal
// -----------------------------------------------------------------------------
export function DateTimePicker({ 
  date, 
  setDate, 
  dateRange,
  setDateRange,
  withRange = false,
  label, 
  includeTime = true 
}: DateTimePickerProps) {
  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);

  // Manejo de selección (Solo para Single Mode con preservación de hora)
  const handleSelectSingle = (day: Date | undefined) => {
    if (!setDate) return;
    if (!day) {
      setDate(undefined);
      return;
    }
    const newDate = new Date(day);
    if (includeTime && date) {
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
    } else if (includeTime) {
      newDate.setHours(12, 0, 0, 0);
    } else {
      newDate.setHours(0, 0, 0, 0);
    }
    setDate(newDate);
  };

  const adjustTime = (type: "hours" | "minutes" | "ampm", step: number) => {
    if (!date || !setDate) return;
    const newDate = new Date(date);

    if (type === "hours") {
      const current = newDate.getHours();
      newDate.setHours((current + step + 24) % 24);
    } else if (type === "minutes") {
      const current = newDate.getMinutes();
      newDate.setMinutes((current + step + 60) % 60);
    } else {
      const current = newDate.getHours();
      newDate.setHours(current >= 12 ? current - 12 : current + 12);
    }
    setDate(newDate);
  };

  // Renderizado del texto del botón
  const renderButtonText = () => {
    if (withRange) {
      if (dateRange?.from) {
        if (dateRange.to) {
          return `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: es })}`;
        }
        return format(dateRange.from, "dd/MM/yyyy", { locale: es });
      }
      return label || "Seleccionar rango";
    }

    // Modo Single
    if (date) {
      return format(date, includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: es });
    }
    return label || (includeTime ? "Seleccionar fecha y hora" : "Seleccionar fecha");
  };

  // Si usamos rango, desactivamos el tiempo para simplificar la UI por ahora
  const showTimePicker = includeTime && !withRange;

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            ((!withRange && !date) || (withRange && !dateRange?.from)) && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{renderButtonText()}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-auto p-0 max-h-[420px] overflow-y-auto z-[9999]" 
        align="start"
        side="bottom"
        collisionPadding={16}
      >
        {withRange ? (
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            initialFocus
            locale={es}
            numberOfMonths={2}
          />
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectSingle}
            initialFocus
            locale={es}
            numberOfMonths={1}
          />
        )}

        {showTimePicker && (
          <div className="p-3 border-t border-border flex flex-col items-center gap-2 bg-muted/5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora</Label>
            <div className="flex items-center gap-3">
              <div>
                <TimePeriod onUp={() => adjustTime("hours", 1)} onDown={() => adjustTime("hours", -1)} disabled={!date}>
                  <TimePickerInput
                    picker="hours"
                    date={date}
                    onDateChange={setDate!}
                    ref={hourRef}
                    onRightFocus={() => minuteRef.current?.focus()}
                    disabled={!date}
                  />
                </TimePeriod>
              </div>
              <span className="text-xl font-bold text-muted-foreground pb-2">:</span>
              <div>
                <TimePeriod onUp={() => adjustTime("minutes", 1)} onDown={() => adjustTime("minutes", -1)} disabled={!date}>
                  <TimePickerInput
                    picker="minutes"
                    date={date}
                    onDateChange={setDate!}
                    ref={minuteRef}
                    onLeftFocus={() => hourRef.current?.focus()}
                    disabled={!date}
                  />
                </TimePeriod>
              </div>
              <div className="w-4"></div>
              <div>
                <TimePeriod onUp={() => adjustTime("ampm", 1)} onDown={() => adjustTime("ampm", -1)} disabled={!date}>
                  <div className={cn("flex items-center justify-center h-8 w-[48px] rounded-md border border-input bg-background font-mono text-sm font-medium", !date && "opacity-50")}>
                    {date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM"}
                  </div>
                </TimePeriod>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}