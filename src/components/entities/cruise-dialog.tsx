import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

import { fetchAPI } from "@/lib/api/fetchApi";
import {
  createCruiseSchema,
  updateCruiseSchema,
} from "@/lib/schemas/cruise/cruise.schema";

import type { Cruise } from "@/lib/interfaces/cruise/cruise.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface CruiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cruise?: Cruise;
  reservationId: string;
  onSave: (cruise: Cruise) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<
  z.input<typeof createCruiseSchema>,
  "reservationId" | "startDate" | "endDate"
> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
};

interface FormErrors extends Partial<Record<string, string>> {
  _general?: string;
}

// 1. Constante para valores por defecto (limpieza y comparación)
const defaultFormData: FormData = {
  provider: "",
  embarkationPort: "",
  arrivalPort: "",
  bookingReference: "",
  startDate: undefined,
  endDate: undefined,
  totalPrice: 0,
  amountPaid: 0,
  currency: Currency.USD,
};

export function CruiseDialog({
  open,
  onOpenChange,
  cruise,
  reservationId,
  onSave,
  onDelete,
}: CruiseDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // 👈 Nuevo estado
  
  const deleteLock = useRef(false);

  // 🔄 Carga de datos
  useEffect(() => {
    if (cruise) {
      setFormData({
        provider: cruise.provider ?? "",
        embarkationPort: cruise.embarkationPort ?? "",
        arrivalPort: cruise.arrivalPort ?? "",
        bookingReference: cruise.bookingReference ?? "",
        startDate: cruise.startDate ? new Date(cruise.startDate) : undefined,
        endDate: cruise.endDate ? new Date(cruise.endDate) : undefined,
        totalPrice: cruise.totalPrice,
        amountPaid: cruise.amountPaid,
        currency: cruise.currency,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [cruise, open]);

  // 2. Lógica "Dirty Check" (¿El usuario modificó algo?)
  const isDirty = useMemo(() => {
    const initialData = cruise
      ? {
          provider: cruise.provider ?? "",
          embarkationPort: cruise.embarkationPort ?? "",
          arrivalPort: cruise.arrivalPort ?? "",
          bookingReference: cruise.bookingReference ?? "",
          // Convertimos fechas a timestamp para comparar fácil
          startDate: cruise.startDate ? new Date(cruise.startDate).getTime() : 0,
          endDate: cruise.endDate ? new Date(cruise.endDate).getTime() : 0,
          totalPrice: Number(cruise.totalPrice),
          amountPaid: Number(cruise.amountPaid),
          currency: cruise.currency,
        }
      : {
          ...defaultFormData,
          startDate: 0,
          endDate: 0,
        };

    const currentData = {
      ...formData,
      startDate: formData.startDate?.getTime() ?? 0,
      endDate: formData.endDate?.getTime() ?? 0,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    };

    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, cruise]);

  // 💾 Guardar
  const handleSave = async () => {
    const isEdit = Boolean(cruise);
    const schema = isEdit ? updateCruiseSchema : createCruiseSchema;

    const newErrors: FormErrors = {};

    if (!formData.startDate) {
      newErrors.startDate = "La fecha de salida es obligatoria.";
    }

    const payloadToValidate = {
      ...formData,
      startDate: formData.startDate?.toISOString() ?? "",
      endDate: formData.endDate ? formData.endDate.toISOString() : undefined,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      for (const err of result.error.issues) {
        const key = err.path[0] as string;
        if (!newErrors[key]) newErrors[key] = err.message;
      }
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validación de cambios vacíos
    if (isEdit && !isDirty) {
      setErrors({ _general: "No se detectaron cambios para guardar." });
      return;
    }

    const finalPayload = {
      provider: formData.provider,
      embarkationPort: formData.embarkationPort,
      arrivalPort: formData.arrivalPort || null,
      bookingReference: formData.bookingReference || null,
      startDate: formData.startDate!.toISOString(),
      endDate: formData.endDate ? formData.endDate.toISOString() : null,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit ? {} : { reservationId, currency: formData.currency || "USD" }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/cruises/${cruise!.id}` : "/cruises";
      const method = isEdit ? "PATCH" : "POST";

      const savedCruise = await fetchAPI<Cruise>(endpoint, {
        method,
        body: JSON.stringify(finalPayload),
      });

      onOpenChange(false);
      setTimeout(() => onSave(savedCruise), 150);
    } catch {
      setErrors({ _general: "Ocurrió un error al guardar el crucero." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); 
    if (!cruise || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/cruises/${cruise.id}`, { method: "DELETE" });
      onDelete?.(cruise.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar crucero." });
      }
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      {/* DIÁLOGO PRINCIPAL */}
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          // Interceptamos cierre con ESC o setOpen externo
          if (!isOpen && isDirty) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent 
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer"
          // 3. INTERCEPTOR CLICK AFUERA
          onInteractOutside={(e) => {
            if (isDirty) {
              e.preventDefault(); 
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {cruise ? "Editar Crucero" : "Crear Crucero"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">
                ⚠️ {errors._general}
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { id: "provider", label: "Proveedor *", placeholder: "MSC Cruises" },
              { id: "embarkationPort", label: "Puerto de embarque *", placeholder: "Buenos Aires" },
              { id: "arrivalPort", label: "Puerto de llegada", placeholder: "Rio de Janeiro" },
              { id: "bookingReference", label: "Referencia", placeholder: "CR-56789" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={(formData[f.id as keyof FormData] as string) || ""}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              <DateTimePicker
                date={formData.startDate}
                setDate={(date) => setFormData({ ...formData, startDate: date })}
                includeTime={false}
              />
              {errors.startDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.startDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de llegada</Label>
              <DateTimePicker
                date={formData.endDate}
                setDate={(date) => setFormData({ ...formData, endDate: date })}
                includeTime={false}
              />
              {errors.endDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.endDate}</p>}
            </div>

            {!cruise && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD" className="cursor-pointer">USD</SelectItem>
                    <SelectItem value="ARS" className="cursor-pointer">ARS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-red-500 text-[10px] md:text-xs">{errors.currency}</p>}
              </div>
            )}

            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "2000" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "500" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  type="number"
                  min={0}
                  value={(formData[f.id as keyof FormData] as number) || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") { setFormData({ ...formData, [f.id]: 0 }); return; }
                    const numValue = Number(value);
                    if (numValue >= 0) { setFormData({ ...formData, [f.id]: numValue }); }
                  }}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "Minus") e.preventDefault(); }}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[f.id] ? "border-red-500" : ""}`}
                />
                {errors[f.id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id]}</p>}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {cruise && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="text-xs md:text-sm cursor-pointer"
                >
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                // 4. Botón Cancelar verifica suciedad
                onClick={() => {
                  if (isDirty) setShowDiscardConfirm(true);
                  else onOpenChange(false);
                }}
                disabled={loading}
                className="text-xs md:text-sm cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                // Habilitamos botón para que salten validaciones de requeridos si está vacío
                disabled={loading || (cruise && !isDirty)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading ? "Guardando..." : cruise ? "Guardar cambios" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT 1: ELIMINAR */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el crucero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT 2: DESCARTAR CAMBIOS */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán los datos ingresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Seguir editando</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false); // Cierra el modal principal
              }} 
              className="cursor-pointer"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}