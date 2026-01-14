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

import { MoneyInput } from "../ui/custom/price-input";

interface CruiseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cruise?: Cruise;
  reservationId: string;
  onSave: (cruise: Cruise) => void;
  onDelete?: (id: string) => void;
  mode?: "create" | "edit" | "view";
}

type FormData = Omit<
  z.input<typeof createCruiseSchema>,
  "reservationId" | "startDate" | "endDate"
> & {
  startDate: Date | undefined;
  endDate: Date | undefined;
};

interface FormErrors extends Partial<Record<keyof FormData | "_general", string>> {
  _general?: string;
}

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
  mode = "create",
}: CruiseDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const deleteLock = useRef(false);

  useEffect(() => {
    if (cruise && open) {
      setFormData({
        provider: cruise.provider ?? "",
        embarkationPort: cruise.embarkationPort ?? "",
        arrivalPort: cruise.arrivalPort ?? "",
        bookingReference: cruise.bookingReference ?? "",
        startDate: cruise.startDate ? new Date(cruise.startDate) : undefined,
        endDate: cruise.endDate ? new Date(cruise.endDate) : undefined,
        totalPrice: Number(cruise.totalPrice ?? 0),
        amountPaid: Number(cruise.amountPaid ?? 0),
        currency: cruise.currency ?? Currency.USD,
      });
    } else if (open) {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [cruise, open]);

  const isDirty = useMemo(() => {
    const normalize = (data: Partial<FormData>) => ({
      provider: data.provider || "",
      embarkationPort: data.embarkationPort || "",
      arrivalPort: data.arrivalPort || "",
      bookingReference: data.bookingReference || "",
      startDate: data.startDate instanceof Date ? data.startDate.getTime() : 0,
      endDate: data.endDate instanceof Date ? data.endDate.getTime() : 0,
      totalPrice: Number(data.totalPrice || 0),
      amountPaid: Number(data.amountPaid || 0),
      currency: data.currency || Currency.USD,
    });

    const initialNormalized = cruise
      ? normalize({
        ...cruise,
        startDate: cruise.startDate ? new Date(cruise.startDate) : undefined,
        endDate: cruise.endDate ? new Date(cruise.endDate) : undefined,
      })
      : normalize(defaultFormData);

    const currentNormalized = normalize(formData);
    return JSON.stringify(initialNormalized) !== JSON.stringify(currentNormalized);
  }, [formData, cruise]);

  const isView = mode === "view";
  const effectiveIsDirty = isView ? false : isDirty;

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
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!newErrors[key]) newErrors[key] = err.message;
      });
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      newErrors.amountPaid = "El monto pagado no puede ser mayor que el total.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEdit && !isDirty) {
      onOpenChange(false);
      return;
    }

    try {
      setLoading(true);
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
      if (err instanceof Error) setErrors({ _general: err.message || "Error al eliminar." });
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen && effectiveIsDirty) setShowDiscardConfirm(true);
          else onOpenChange(isOpen);
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer scrollbar-thin"
          onWheel={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            if (effectiveIsDirty) {
              e.preventDefault();
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isView ? "Ver Crucero" : cruise ? "Editar Crucero" : "Crear Crucero"}
            </DialogTitle>
          </DialogHeader>

          {errors._general && (
            <div className="mb-3 rounded-md bg-red-50 border border-red-300 p-3">
              <p className="text-[11px] md:text-xs text-red-600 font-medium flex items-center gap-2">⚠️ {errors._general}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {(["provider", "embarkationPort", "arrivalPort", "bookingReference"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "provider" ? "Proveedor *" :
                    id === "embarkationPort" ? "Puerto de embarque *" :
                      id === "arrivalPort" ? "Puerto de llegada" : "Referencia"}
                </Label>
                <Input
                  id={id}
                  value={String(formData[id] ?? "")}
                  onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                  placeholder=""
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""} ${errors[id] ? "border-red-500" : ""}`}
                  disabled={isView}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de salida *</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.startDate ? formData.startDate.toLocaleDateString() : "—"}
                </div>
              ) : (
                <DateTimePicker date={formData.startDate} setDate={(date) => setFormData({ ...formData, startDate: date })} includeTime={false} />
              )}
              {errors.startDate && <p className="text-red-500 text-[10px] md:text-xs">{errors.startDate}</p>}
            </div>

            <div className="space-y-1 [&>button]:cursor-pointer">
              <Label className="text-[11px] md:text-xs">Fecha de llegada</Label>
              {isView ? (
                <div className="h-8 md:h-9 flex items-center text-xs md:text-sm bg-muted/50 rounded px-3 border border-input">
                  {formData.endDate ? formData.endDate.toLocaleDateString() : "—"}
                </div>
              ) : (
                <DateTimePicker date={formData.endDate} setDate={(date) => setFormData({ ...formData, endDate: date })} includeTime={false} />
              )}
            </div>

            {!cruise && !isView && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select value={formData.currency} onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(["totalPrice", "amountPaid"] as const).map((id) => (
              <div key={id} className="space-y-1">
                <Label htmlFor={id} className="text-[11px] md:text-xs">
                  {id === "totalPrice" ? "Precio total *" : "Monto pagado *"}
                </Label>
                <MoneyInput
                  value={Number(formData[id])} // Pasamos el valor numérico del estado
                  onChange={(val) => setFormData({ ...formData, [id]: val })} // Actualizamos estado
                  placeholder={id === "totalPrice" ? "Ej: 1500.00" : "Ej: 0"}
                  disabled={isView}
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""
                    } ${errors[id] ? "border-red-500" : ""}`}
                />
                {errors[id] && <p className="text-red-500 text-[10px] md:text-xs">{errors[id]}</p>}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {!isView && cruise && (
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                  {loading ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              {isView ? (
                <Button onClick={() => onOpenChange(false)} className="text-xs md:text-sm cursor-pointer">Cerrar</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => effectiveIsDirty ? setShowDiscardConfirm(true) : onOpenChange(false)} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="text-xs md:text-sm cursor-pointer">
                    {loading ? "Guardando..." : cruise ? "Guardar cambios" : "Crear"}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el crucero.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>Tienes cambios sin guardar. Si sales ahora, se perderán los datos ingresados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardConfirm(false);
                onOpenChange(false);
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