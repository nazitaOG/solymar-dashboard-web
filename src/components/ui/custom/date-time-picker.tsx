import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronUp, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  date?: Date;
  setDate?: (date: Date | undefined) => void;

  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
  withRange?: boolean;

  label?: string;
  includeTime?: boolean;
}

interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: "hours" | "minutes";
  date: Date | undefined;
  onDateChange: (date: Date) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      className,
      picker,
      date,
      onDateChange,
      onRightFocus,
      onLeftFocus,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [hasFocus, setHasFocus] = React.useState(false);

    const getDateValue = React.useCallback(() => {
      if (!date) return "00";
      const val =
        picker === "hours" ? date.getHours() % 12 || 12 : date.getMinutes();
      return val.toString().padStart(2, "0");
    }, [date, picker]);

    const [localValue, setLocalValue] = React.useState(getDateValue);

    React.useEffect(() => {
      if (!hasFocus) setLocalValue(getDateValue());
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

      if (picker === "hours" && v.length === 2) onRightFocus?.();
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setHasFocus(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setHasFocus(false);
      setLocalValue(getDateValue());
      onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      if (
        ["Tab", "Backspace", "Delete", "ArrowUp", "ArrowDown"].includes(e.key)
      )
        return;
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn(
          "w-[38px] md:w-[52px] text-center font-mono text-[11px] md:text-sm p-0 h-7 md:h-9 focus:ring-0 focus-visible:ring-1",
          className,
        )}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={!date}
        {...props}
      />
    );
  },
);
TimePickerInput.displayName = "TimePickerInput";

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
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 md:h-7 md:w-7"
      onClick={onUp}
      disabled={disabled}
    >
      <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
    </Button>
    {children}
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 md:h-7 md:w-7"
      onClick={onDown}
      disabled={disabled}
    >
      <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
    </Button>
  </div>
);

export function DateTimePicker({
  date,
  setDate,
  dateRange,
  setDateRange,
  withRange = false,
  label,
  includeTime = true,
}: DateTimePickerProps) {
  const hourRef = React.useRef<HTMLInputElement>(null);
  const minuteRef = React.useRef<HTMLInputElement>(null);

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
      newDate.setHours((newDate.getHours() + step + 24) % 24);
    } else if (type === "minutes") {
      newDate.setMinutes((newDate.getMinutes() + step + 60) % 60);
    } else {
      const current = newDate.getHours();
      newDate.setHours(current >= 12 ? current - 12 : current + 12);
    }
    setDate(newDate);
  };

  const renderButtonText = () => {
    if (withRange) {
      if (!dateRange?.from) return label || "Seleccionar rango";
      if (!dateRange.to)
        return format(dateRange.from, "dd/MM/yyyy", { locale: es });
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: es })} - ${format(
        dateRange.to,
        "dd/MM/yyyy",
        { locale: es },
      )}`;
    }

    if (!date)
      return label || (includeTime ? "Seleccionar fecha y hora" : "Seleccionar fecha");

    return format(date, includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", {
      locale: es,
    });
  };

  const showTimePicker = includeTime && !withRange;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-7 md:h-9 text-[10px] md:text-sm",
            ((!withRange && !date) || (withRange && !dateRange?.from)) &&
              "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="truncate">{renderButtonText()}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className=" z-10 w-[250px] md:w-auto p-0 text-[10px] md:text-sm max-h-[calc(100vh-80px)] overflow-y-auto"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        {withRange ? (
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            initialFocus
            locale={es}
            numberOfMonths={1}
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
            <Label className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hora
            </Label>
            <div className="flex items-center gap-3">
              <TimePeriod
                onUp={() => adjustTime("hours", 1)}
                onDown={() => adjustTime("hours", -1)}
                disabled={!date}
              >
                <TimePickerInput
                  picker="hours"
                  date={date}
                  onDateChange={setDate!}
                  ref={hourRef}
                  onRightFocus={() => minuteRef.current?.focus()}
                  disabled={!date}
                />
              </TimePeriod>

              <span className="text-lg md:text-xl font-bold text-muted-foreground pb-2">
                :
              </span>

              <TimePeriod
                onUp={() => adjustTime("minutes", 1)}
                onDown={() => adjustTime("minutes", -1)}
                disabled={!date}
              >
                <TimePickerInput
                  picker="minutes"
                  date={date}
                  onDateChange={setDate!}
                  ref={minuteRef}
                  onLeftFocus={() => hourRef.current?.focus()}
                  disabled={!date}
                />
              </TimePeriod>

              <div className="w-3 md:w-4" />

              <TimePeriod
                onUp={() => adjustTime("ampm", 1)}
                onDown={() => adjustTime("ampm", -1)}
                disabled={!date}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-7 md:h-8 w-[40px] md:w-[52px] rounded-md border border-input bg-background font-mono text-[11px] md:text-sm font-medium",
                    !date && "opacity-50",
                  )}
                >
                  {date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM"}
                </div>
              </TimePeriod>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
