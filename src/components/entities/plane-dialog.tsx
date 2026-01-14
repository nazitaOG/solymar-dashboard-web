import { useState, useEffect, useRef, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  createPlaneSchema,
  updatePlaneSchema,
} from "@/lib/schemas/plane/plane.schema";

import type { Plane } from "@/lib/interfaces/plane/plane.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

import { MoneyInput } from "../ui/custom/price-input";

interface PlaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plane?: Plane;
  reservationId: string;
  onSave: (plane: Plane) => void;
  onDelete?: (id: string) => void;
  mode?: "create" | "edit" | "view";
}

type FormData = Omit<
  z.input<typeof createPlaneSchema>,
  "reservationId" | "segments"
> & {
  segments: {
    segmentOrder: number;
    departure: string;
    arrival: string;
    departureDate: Date | undefined;
    arrivalDate: Date | undefined;
    airline?: string;
    flightNumber?: string;
  }[];
};

interface FormErrors extends Record<string, string | undefined> {
  _general?: string;
}

const defaultFormData: FormData = {
  bookingReference: "",
  provider: "",
  totalPrice: 0,
  amountPaid: 0,
  notes: "",
  currency: Currency.USD,
  segments: [],
};

export function PlaneDialog({
  open,
  onOpenChange,
  plane,
  reservationId,
  onSave,
  onDelete,
  mode = "create",
}: PlaneDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const deleteLock = useRef(false);

  useEffect(() => {
    if (open) {
      if (plane) {
        setFormData({
          bookingReference: plane.bookingReference ?? "",
          provider: plane.provider ?? "",
          totalPrice: plane.totalPrice,
          amountPaid: plane.amountPaid,
          notes: plane.notes ?? "",
          currency: plane.currency,
          segments: plane.segments.map((s) => ({
            segmentOrder: s.segmentOrder,
            departure: s.departure,
            arrival: s.arrival,
            departureDate: s.departureDate
              ? new Date(s.departureDate)
              : undefined,
            arrivalDate: s.arrivalDate ? new Date(s.arrivalDate) : undefined,
            airline: s.airline ?? "",
            flightNumber: s.flightNumber ?? "",
          })),
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [open, plane]);

  const isDirty = useMemo(() => {
    const getTime = (d?: Date | string) => {
      if (!d) return 0;
      return typeof d === "string" ? new Date(d).getTime() : d.getTime();
    };

    const normalize = (data: FormData) => ({
      bookingReference: data.bookingReference ?? "",
      provider: data.provider ?? "",
      totalPrice: Number(data.totalPrice),
      amountPaid: Number(data.amountPaid),
      notes: data.notes ?? "",
      currency: data.currency,
      segments: data.segments.map((s) => ({
        segmentOrder: s.segmentOrder,
        departure: s.departure,
        arrival: s.arrival,
        airline: s.airline ?? "",
        flightNumber: s.flightNumber ?? "",
        departureDate: getTime(s.departureDate),
        arrivalDate: getTime(s.arrivalDate),
      })),
    });

    const initialData = plane
      ? normalize({
        bookingReference: plane.bookingReference ?? "",
        provider: plane.provider ?? "",
        totalPrice: plane.totalPrice,
        amountPaid: plane.amountPaid,
        notes: plane.notes ?? "",
        currency: plane.currency,
        segments: plane.segments.map((s) => ({
          segmentOrder: s.segmentOrder,
          departure: s.departure,
          arrival: s.arrival,
          departureDate: s.departureDate
            ? new Date(s.departureDate)
            : undefined,
          arrivalDate: s.arrivalDate ? new Date(s.arrivalDate) : undefined,
          airline: s.airline ?? "",
          flightNumber: s.flightNumber ?? "",
        })),
      } as FormData)
      : normalize(defaultFormData);

    const currentData = normalize(formData);

    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, plane]);

  const isView = mode === "view";
  const effectiveIsDirty = isView ? false : isDirty;

  const updateSegment = (
    index: number,
    field: keyof FormData["segments"][number],
    value: string | Date | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));

    if ((errors as Record<string, string | undefined>)[`segments.${index}.${String(field)}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev } as Record<string, string | undefined>;
        delete newErrors[`segments.${index}.${String(field)}`];
        return newErrors;
      });
    }
  };

  const removeSegment = (index: number) => {
    setFormData({
      ...formData,
      segments: formData.segments
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, segmentOrder: i + 1 })),
    });
    setErrors({});
  };

  const handleSave = async () => {
    const allErrors: FormErrors = {};

    formData.segments.forEach((s, index) => {
      if (!s.departureDate) {
        allErrors[`segments.${index}.departureDate`] =
          "La fecha de salida es obligatoria";
      }
      if (!s.arrivalDate) {
        allErrors[`segments.${index}.arrivalDate`] =
          "La fecha de llegada es obligatoria";
      }
    });

    const isEdit = Boolean(plane);
    const schema = isEdit ? updatePlaneSchema : createPlaneSchema;

    const payloadToValidate = {
      ...formData,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      segments: formData.segments.map((s, i) => ({
        segmentOrder: i + 1,
        departure: s.departure,
        arrival: s.arrival,
        departureDate: s.departureDate?.toISOString() ?? "",
        arrivalDate: s.arrivalDate?.toISOString() ?? "",
        airline: s.airline || undefined,
        flightNumber: s.flightNumber || undefined,
      })),
      ...(isEdit ? {} : { reservationId }),
    };

    const result = schema.safeParse(payloadToValidate);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!allErrors[key]) {
          allErrors[key] = issue.message;
        }
      }
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      allErrors["amountPaid"] =
        "El monto pagado no puede ser mayor que el total.";
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    if (isEdit && !isDirty) {
      setErrors({ _general: "No se detectaron cambios para guardar." });
      return;
    }

    try {
      setLoading(true);
      const endpoint = isEdit ? `/planes/${plane!.id}` : "/planes";
      const method = isEdit ? "PATCH" : "POST";

      const saved = await fetchAPI<Plane>(endpoint, {
        method,
        body: JSON.stringify(payloadToValidate),
      });

      onOpenChange(false);
      setTimeout(() => {
        onSave(saved);
      }, 150);
    } catch {
      setErrors({ _general: "Error al guardar el vuelo." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    if (!plane || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/planes/${plane.id}`, { method: "DELETE" });
      onDelete?.(plane.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch {
      setErrors({ _general: "Error al eliminar el vuelo." });
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
          if (!isOpen && effectiveIsDirty) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(isOpen);
          }
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
              {isView
                ? plane
                  ? "Ver Vuelo"
                  : "Ver Vuelo"
                : plane
                  ? "Editar Vuelo"
                  : "Crear Vuelo"}
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
            {(["bookingReference", "provider"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key} className="text-[11px] md:text-xs">
                  {key === "bookingReference"
                    ? "Referencia *"
                    : "Proveedor (opcional)"}
                </Label>
                <Input
                  id={key}
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  placeholder={
                    key === "bookingReference"
                      ? "Ej: PNR-XYZ123"
                      : "Ej: Despegar / Aerolíneas"
                  }
                  className={`h-8 md:h-9 text-xs md:text-sm ${errors[key] ? "border-red-500" : ""}`}
                  disabled={isView}
                />
                {errors[key] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}

            {(["totalPrice", "amountPaid"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key} className="text-[11px] md:text-xs">
                  {key === "totalPrice" ? "Precio total *" : "Monto pagado *"}
                </Label>

                <MoneyInput
                  value={formData[key] as number}
                  onChange={(val) => setFormData({ ...formData, [key]: val })}
                  placeholder={key === "totalPrice" ? "Ej: 1500.00" : "Ej: 500.00"}
                  disabled={isView}
                  className={`h-8 md:h-9 text-xs md:text-sm ${isView ? "bg-muted/50 cursor-default" : ""
                    } ${errors[key] ? "border-red-500" : ""}`}
                />

                {errors[key] && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}

            {!plane && !isView && (
              <div className="space-y-1">
                <Label className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) =>
                    setFormData({ ...formData, currency: v })
                  }
                >
                  <SelectTrigger className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD" className="cursor-pointer">
                      USD
                    </SelectItem>
                    <SelectItem value="ARS" className="cursor-pointer">
                      ARS
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-red-500 text-[10px] md:text-xs">
                    {errors.currency}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-1">
            <Label className="text-[11px] md:text-xs">Notas (opcional)</Label>
            <Textarea
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Ej: Solicitar menú vegetariano, asientos en pasillo..."
              className="text-xs md:text-sm"
              disabled={isView}
            />
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="flex justify-between items-center">
                <Label className="text-[11px] md:text-xs">
                  Tramos del vuelo *
                </Label>

                {!isView && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        segments: [
                          ...formData.segments,
                          {
                            segmentOrder: formData.segments.length + 1,
                            departure: "",
                            arrival: "",
                            departureDate: undefined,
                            arrivalDate: undefined,
                            airline: "",
                            flightNumber: "",
                          },
                        ],
                      })
                    }
                    className="h-7 md:h-8 px-2 text-[11px] md:text-xs cursor-pointer"
                  >
                    + Agregar tramo
                  </Button>
                )}
              </div>
              {errors.segments && (
                <p className="text-red-500 text-[10px] md:text-xs mt-1">
                  {errors.segments}
                </p>
              )}
            </div>

            {formData.segments.map((seg, index) => (
              <div
                key={index}
                className="border p-3 md:p-4 rounded-md space-y-3 md:space-y-4 bg-muted/10 text-xs md:text-sm"
              >
                <div className="flex justify-between items-center">
                  <p className="text-[11px] md:text-xs font-semibold">
                    Tramo #{index + 1}
                  </p>
                  {!isView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 h-7 md:h-8 px-2 text-[11px] md:text-xs hover:text-red-600 cursor-pointer"
                      onClick={() => removeSegment(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] md:text-xs">
                      Origen (IATA)
                    </Label>
                    <Input
                      placeholder="Ej: EZE"
                      value={seg.departure}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "departure",
                          e.target.value.toUpperCase(),
                        )
                      }
                      maxLength={3}
                      className={`h-8 md:h-9 text-xs md:text-sm uppercase ${errors[`segments.${index}.departure`] ? "border-red-500" : ""}`}
                      disabled={isView}
                    />
                    {errors[`segments.${index}.departure`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.departure`]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] md:text-xs">
                      Destino (IATA)
                    </Label>
                    <Input
                      placeholder="Ej: MIA"
                      value={seg.arrival}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "arrival",
                          e.target.value.toUpperCase(),
                        )
                      }
                      maxLength={3}
                      className={`h-8 md:h-9 text-xs md:text-sm uppercase ${errors[`segments.${index}.arrival`] ? "border-red-500" : ""}`}
                      disabled={isView}
                    />
                    {errors[`segments.${index}.arrival`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.arrival`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 [&>button]:cursor-pointer">
                    <Label className="text-[11px] md:text-xs">Salida</Label>
                    {isView ? (
                      <div className="h-8 md:h-9 flex items-center text-xs md:text-sm">
                        {seg.departureDate
                          ? seg.departureDate.toLocaleString()
                          : "—"}
                      </div>
                    ) : (
                      <DateTimePicker
                        key={`departure-${index}`}
                        date={seg.departureDate}
                        setDate={(date) =>
                          updateSegment(index, "departureDate", date)
                        }
                        includeTime={true}
                      />
                    )}
                    {errors[`segments.${index}.departureDate`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.departureDate`]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 [&>button]:cursor-pointer">
                    <Label className="text-[11px] md:text-xs">Llegada</Label>
                    {isView ? (
                      <div className="h-8 md:h-9 flex items-center text-xs md:text-sm">
                        {seg.arrivalDate
                          ? seg.arrivalDate.toLocaleString()
                          : "—"}
                      </div>
                    ) : (
                      <DateTimePicker
                        key={`arrival-${index}`}
                        date={seg.arrivalDate}
                        setDate={(date) =>
                          updateSegment(index, "arrivalDate", date)
                        }
                        includeTime={true}
                      />
                    )}
                    {errors[`segments.${index}.arrivalDate`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.arrivalDate`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] md:text-xs">
                      Aerolínea (Opcional)
                    </Label>
                    <Input
                      placeholder="Ej: Aerolíneas Argentinas"
                      value={seg.airline ?? ""}
                      onChange={(e) =>
                        updateSegment(index, "airline", e.target.value)
                      }
                      className={`h-8 md:h-9 text-xs md:text-sm ${errors[`segments.${index}.airline`] ? "border-red-500" : ""}`}
                      disabled={isView}
                    />
                    {errors[`segments.${index}.airline`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.airline`]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] md:text-xs">
                      Nro. Vuelo (Opcional)
                    </Label>
                    <Input
                      placeholder="Ej: AR1302"
                      value={seg.flightNumber ?? ""}
                      onChange={(e) =>
                        updateSegment(index, "flightNumber", e.target.value)
                      }
                      className={`h-8 md:h-9 text-xs md:text-sm ${errors[`segments.${index}.flightNumber`] ? "border-red-500" : ""}`}
                      disabled={isView}
                    />
                    {errors[`segments.${index}.flightNumber`] && (
                      <p className="text-red-500 text-[10px] md:text-xs">
                        {errors[`segments.${index}.flightNumber`]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {!isView && plane && (
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
              {isView ? (
                <Button
                  onClick={() => onOpenChange(false)}
                  className="text-xs md:text-sm cursor-pointer"
                >
                  Cerrar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
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
                    disabled={loading || (plane && !isDirty)}
                    className="text-xs md:text-sm cursor-pointer"
                  >
                    {loading
                      ? "Guardando..."
                      : plane
                        ? "Guardar cambios"
                        : "Crear vuelo"}
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
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el vuelo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, se perderán los datos
              ingresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Seguir editando
            </AlertDialogCancel>
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
