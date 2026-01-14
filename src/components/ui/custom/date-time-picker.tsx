import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ----------------------------------------------------------------------
// 1. LÓGICA DEL CALENDARIO INTERNO
// ----------------------------------------------------------------------

interface InternalCalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  showTime?: boolean
  showMonthYearPicker?: boolean
  className?: string
  // Range selection props
  rangeMode?: boolean
  startDate?: Date
  endDate?: Date
  onRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void
  startYear?: number
  endYear?: number
}

type View = "days" | "months" | "years"

function InternalCalendar({
  value,
  onChange,
  showTime = false,
  showMonthYearPicker = false,
  className,
  rangeMode = false,
  startDate,
  endDate,
  onRangeChange,
  startYear = 1900,
  endYear = 2100,
}: InternalCalendarProps) {
  const initialDate = value || startDate || new Date()
  
  const [selectedDate, setSelectedDate] = React.useState<Date>(initialDate)
  const [currentMonth, setCurrentMonth] = React.useState(initialDate.getMonth())
  const [currentYear, setCurrentYear] = React.useState(initialDate.getFullYear())
  
  const [yearPageStart, setYearPageStart] = React.useState(Math.floor(initialDate.getFullYear() / 12) * 12)

  const [view, setView] = React.useState<View>("days")
  
  const [hours, setHours] = React.useState(initialDate.getHours())
  const [minutes, setMinutes] = React.useState(initialDate.getMinutes())

  const [selectedDay, setSelectedDay] = React.useState<number | null>(value?.getDate() || null)

  const [rangeStart, setRangeStart] = React.useState<Date | undefined>(startDate)
  const [rangeEnd, setRangeEnd] = React.useState<Date | undefined>(endDate)
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>()

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setHours(value.getHours())
      setMinutes(value.getMinutes())
      setSelectedDay(value.getDate())
      if (!rangeMode) {
        setCurrentMonth(value.getMonth())
        setCurrentYear(value.getFullYear())
        setYearPageStart(Math.floor(value.getFullYear() / 12) * 12)
      }
    }
  }, [value, rangeMode])

  React.useEffect(() => {
    if (rangeMode) {
      setRangeStart(startDate)
      setRangeEnd(endDate)
    }
  }, [startDate, endDate, rangeMode])

  React.useEffect(() => {
    if (view === "years") {
      setYearPageStart(Math.floor(currentYear / 12) * 12)
    }
  }, [view, currentYear])


  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  const weekDays = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handleDateSelect = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day, hours, minutes)

    if (rangeMode) {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(newDate)
        setRangeEnd(undefined)
        onRangeChange?.(newDate, undefined)
      } else {
        if (newDate < rangeStart) {
          setRangeStart(newDate)
          setRangeEnd(rangeStart)
          onRangeChange?.(newDate, rangeStart)
        } else {
          setRangeEnd(newDate)
          onRangeChange?.(rangeStart, newDate)
        }
      }
    } else {
      setSelectedDay(day)
      setSelectedDate(newDate)
      onChange?.(newDate)
    }
  }

  const isInRange = (date: Date) => {
    if (!rangeStart) return false
    const compareEnd = rangeEnd || hoverDate
    if (!compareEnd) return false

    const start = rangeStart < compareEnd ? rangeStart : compareEnd
    const end = rangeStart < compareEnd ? compareEnd : rangeStart
    
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()

    return d >= s && d <= e
  }

  const isRangeBoundary = (date: Date) => {
    if (!rangeStart) return false
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const s = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()).getTime()
    
    if (d === s) return true
    
    if (rangeEnd) {
      const e = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()).getTime()
      if (d === e) return true
    }
    return false
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex)
    if (!rangeMode && selectedDay !== null) {
      const daysInNewMonth = getDaysInMonth(monthIndex, currentYear)
      const validDay = Math.min(selectedDay, daysInNewMonth)
      setSelectedDay(validDay)
      const newDate = new Date(currentYear, monthIndex, validDay, hours, minutes)
      setSelectedDate(newDate)
      onChange?.(newDate)
    }
    setView("days")
  }

  const handleYearSelect = (year: number) => {
    setCurrentYear(year)
    if (!rangeMode && selectedDay !== null) {
      const daysInNewMonth = getDaysInMonth(currentMonth, year)
      const validDay = Math.min(selectedDay, daysInNewMonth)
      setSelectedDay(validDay)
      const newDate = new Date(year, currentMonth, validDay, hours, minutes)
      setSelectedDate(newDate)
      onChange?.(newDate)
    }
    setView("days")
  }

  const handleTimeChange = (type: "hours" | "minutes", val: number) => {
    if (type === "hours") {
      setHours(val)
      if (!rangeMode) {
        const newDate = new Date(selectedDate)
        newDate.setHours(val)
        setSelectedDate(newDate)
        onChange?.(newDate)
      }
    } else {
      setMinutes(val)
      if (!rangeMode) {
        const newDate = new Date(selectedDate)
        newDate.setMinutes(val)
        setSelectedDate(newDate)
        onChange?.(newDate)
      }
    }
  }

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear)
    const naturalCells = firstDayIndex + daysInMonth;
    const naturalRows = Math.ceil(naturalCells / 7);
    const addTopRow = naturalRows === 4;
    const daysFromPrevMonthToRender = firstDayIndex + (addTopRow ? 7 : 0);

    const days = []

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear)

    // Helper para detectar "HOY"
    const today = new Date();
    const checkIsToday = (d: number, m: number, y: number) => {
        return d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    }

    // Días del mes anterior
    for (let i = daysFromPrevMonthToRender - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      // 🟢 Verificamos si algún día del mes anterior (relleno) es hoy
      const isToday = checkIsToday(day, prevMonth, prevYear);

      days.push(
        <button
          key={`prev-${day}`}
          onClick={() => handleDateSelect(day, prevMonth, prevYear)}
          className={cn(
            "p-2 text-muted-foreground/30 text-xs flex items-center justify-center rounded-md hover:bg-accent/50 cursor-pointer",
            isToday && "bg-accent/30 font-semibold text-accent-foreground" // Estilo sutil si es hoy
          )}
        >
          {day}
        </button>,
      )
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      
      const isSelected = !rangeMode && 
        selectedDay === day &&
        currentMonth === selectedDate.getMonth() &&
        currentYear === selectedDate.getFullYear()

      const inRange = rangeMode && isInRange(date)
      const isBoundary = rangeMode && isRangeBoundary(date)
      
      // 🟢 Verificamos si es hoy
      const isToday = checkIsToday(day, currentMonth, currentYear);

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day, currentMonth, currentYear)}
          onMouseEnter={() => rangeMode && setHoverDate(date)}
          onMouseLeave={() => rangeMode && setHoverDate(undefined)}
          className={cn(
            "h-8 w-8 p-0 text-sm flex items-center justify-center rounded-md transition-all cursor-pointer",
            "hover:bg-accent hover:text-accent-foreground",
            
            // Estilos para "Hoy" (Si NO está seleccionado)
            isToday && !isSelected && !isBoundary && "bg-accent/50 text-accent-foreground font-semibold border border-primary/20",
            // Estilos para "Hoy" (Si SÍ está seleccionado - negrita extra)
            isToday && (isSelected || isBoundary) && "font-extrabold ring-1 ring-background",

            inRange && !isBoundary && "bg-accent text-accent-foreground rounded-none",
            (isSelected || isBoundary) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm",
            isBoundary && rangeStart && date.getTime() === new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()).getTime() && "rounded-l-md rounded-r-none",
            isBoundary && rangeEnd && date.getTime() === new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()).getTime() && "rounded-r-md rounded-l-none",
            isBoundary && rangeStart && !rangeEnd && "rounded-md"
          )}
        >
          {day}
        </button>,
      )
    }

    // Relleno final
    const totalCellsRendered = days.length;
    const remainingCells = 42 - totalCellsRendered;

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

    for (let day = 1; day <= remainingCells; day++) {
      // 🟢 Verificamos si algún día del mes siguiente (relleno) es hoy
      const isToday = checkIsToday(day, nextMonth, nextYear);

      days.push(
        <button
          key={`next-${day}`}
          onClick={() => handleDateSelect(day, nextMonth, nextYear)}
          className={cn(
            "p-2 text-muted-foreground/30 text-xs flex items-center justify-center rounded-md hover:bg-accent/50 cursor-pointer",
            isToday && "bg-accent/30 font-semibold text-accent-foreground"
          )}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  const handlePrevious = () => {
    if (view === "days") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else if (view === "months") {
      setCurrentYear(currentYear - 1)
    } else if (view === "years") {
      setYearPageStart(yearPageStart - 12)
    }
  }

  const handleNext = () => {
    if (view === "days") {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    } else if (view === "months") {
      setCurrentYear(currentYear + 1)
    } else if (view === "years") {
      setYearPageStart(yearPageStart + 12)
    }
  }

  const renderYears = () => {
    const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);

    return (
      <div className="grid grid-cols-3 gap-2">
        {years.map((year) => {
          const isDisabled = year < startYear || year > endYear;
          return (
            <Button
              key={year}
              variant={currentYear === year ? "default" : "ghost"}
              onClick={() => !isDisabled && handleYearSelect(year)}
              disabled={isDisabled}
              className={cn(
                "h-9 text-xs",
                isDisabled ? "opacity-20 cursor-not-allowed hover:bg-transparent" : "cursor-pointer"
              )}
            >
              {year}
            </Button>
          )
        })}
      </div>
    );
  };

  return (
    <div className={cn("p-3 w-auto", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={handlePrevious} className="h-7 w-7 bg-transparent border-none hover:bg-accent cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {view === "days" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => showMonthYearPicker && setView("months")}
                className={cn("h-7 px-2 font-semibold text-sm", !showMonthYearPicker ? "cursor-default hover:bg-transparent" : "cursor-pointer")}
              >
                {months[currentMonth]}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => showMonthYearPicker && setView("years")}
                className={cn("h-7 px-2 font-semibold text-sm", !showMonthYearPicker ? "cursor-default hover:bg-transparent" : "cursor-pointer")}
              >
                {currentYear}
              </Button>
            </>
          )}
          {view === "months" && <span className="font-semibold text-sm">{currentYear}</span>}
          {view === "years" && (
            <span className="font-semibold text-sm">
              {yearPageStart} - {yearPageStart + 11}
            </span>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={handleNext} className="h-7 w-7 bg-transparent border-none hover:bg-accent cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {view === "days" && (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 w-full">{renderDays()}</div>
        </>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={currentMonth === index ? "default" : "ghost"}
              onClick={() => handleMonthSelect(index)}
              className="h-9 text-xs cursor-pointer"
            >
              {month.substring(0, 3)}
            </Button>
          ))}
        </div>
      )}

      {view === "years" && renderYears()}

      {showTime && view === "days" && !rangeMode && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" onClick={() => handleTimeChange("hours", (hours + 1) % 24)}>
                  <ChevronLeft className="h-3 w-3 rotate-90" />
                </Button>
                <div className="bg-muted rounded px-2 py-1 text-sm font-mono font-medium min-w-[32px] text-center">
                  {hours.toString().padStart(2, "0")}
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" onClick={() => handleTimeChange("hours", hours === 0 ? 23 : hours - 1)}>
                  <ChevronRight className="h-3 w-3 rotate-90" />
                </Button>
              </div>
              
              <span className="text-muted-foreground font-bold pb-1">:</span>

              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" onClick={() => handleTimeChange("minutes", (minutes + 1) % 60)}>
                  <ChevronLeft className="h-3 w-3 rotate-90" />
                </Button>
                <div className="bg-muted rounded px-2 py-1 text-sm font-mono font-medium min-w-[32px] text-center">
                  {minutes.toString().padStart(2, "0")}
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 cursor-pointer" onClick={() => handleTimeChange("minutes", minutes === 0 ? 59 : minutes - 1)}>
                  <ChevronRight className="h-3 w-3 rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ----------------------------------------------------------------------
// 2. EXPORT PRINCIPAL
// ----------------------------------------------------------------------

import { DateRange } from "react-day-picker"

interface DateTimePickerProps {
  date?: Date;
  setDate?: (date: Date | undefined) => void;

  dateRange?: DateRange;
  setDateRange?: (range: DateRange | undefined) => void;
  withRange?: boolean;

  label?: string;
  includeTime?: boolean;
  
  showYearNavigation?: boolean;
  startYear?: number;
  endYear?: number;
}

export function DateTimePicker({
  date,
  setDate,
  dateRange,
  setDateRange,
  withRange = false,
  label,
  includeTime = true,
  startYear,
  endYear,
}: DateTimePickerProps) {

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
    if (!date) return label || (includeTime ? "Seleccionar fecha y hora" : "Seleccionar fecha");
    return format(date, includeTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy", { locale: es });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-7 md:h-9 text-[10px] md:text-sm cursor-pointer",
            ((!withRange && !date) || (withRange && !dateRange?.from)) &&
              "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="truncate">{renderButtonText()}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <InternalCalendar
          value={date}
          onChange={setDate}
          
          rangeMode={withRange}
          startDate={dateRange?.from}
          endDate={dateRange?.to}
          onRangeChange={(start, end) => setDateRange?.({ from: start, to: end })}

          showTime={includeTime}
          showMonthYearPicker={true}
          
          startYear={startYear}
          endYear={endYear}
          
          className="border-none shadow-none"
        />
      </PopoverContent>
    </Popover>
  );
}