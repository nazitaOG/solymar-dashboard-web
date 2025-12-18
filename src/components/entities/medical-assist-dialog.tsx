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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createMedicalAssistSchema,
  updateMedicalAssistSchema,
} from "@/lib/schemas/medical-assist/medical-assist.schema";

import { fetchAPI } from "@/lib/api/fetchApi";
import type { MedicalAssist } from "@/lib/interfaces/medical_assist/medical_assist.interface";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { z } from "zod";

interface MedicalAssistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assist?: MedicalAssist;
  reservationId: string;
  onSave: (assist: MedicalAssist) => void;
  onDelete?: (id: string) => void;
}

type FormData = Omit<z.input<typeof createMedicalAssistSchema>, "reservationId">;

interface FormErrors extends Partial<Record<keyof FormData, string>> {
  _general?: string;
}

// 1. Constante para valores por defecto (limpieza y comparación)
const defaultFormData: FormData = {
  bookingReference: "",
  assistType: "",
  provider: "",
  totalPrice: 0,
  amountPaid: 0,
  currency: Currency.USD,
};

export function MedicalAssistDialog({
  open,
  onOpenChange,
  assist,
  reservationId,
  onSave,
  onDelete,
}: MedicalAssistDialogProps) {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false); // 👈 Nuevo estado
  
  const deleteLock = useRef(false);

  // 🔄 Prellenar datos al abrir
  useEffect(() => {
    if (assist) {
      setFormData({
        bookingReference: assist.bookingReference ?? "",
        assistType: assist.assistType ?? "",
        provider: assist.provider,
        totalPrice: assist.totalPrice,
        amountPaid: assist.amountPaid,
        currency: assist.currency,
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [assist, open]);

  // 2. Lógica "Dirty Check"
  const isDirty = useMemo(() => {
    const initialData = assist
      ? {
          bookingReference: assist.bookingReference ?? "",
          assistType: assist.assistType ?? "",
          provider: assist.provider,
          totalPrice: Number(assist.totalPrice),
          amountPaid: Number(assist.amountPaid),
          currency: assist.currency,
        }
      : defaultFormData;

    const currentData = {
      ...formData,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    };

    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [formData, assist]);

  // 💾 Guardar
  const handleSave = async () => {
    const isEdit = Boolean(assist);
    const schema = isEdit ? updateMedicalAssistSchema : createMedicalAssistSchema;

    const newErrors: FormErrors = {};

    const result = schema.safeParse({
      ...formData,
      ...(isEdit ? {} : { reservationId }),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    });

    if (!result.success) {
      for (const err of result.error.issues) {
        const key = err.path[0] as keyof FormData;
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

    const payload = {
      bookingReference: formData.bookingReference || null,
      assistType: formData.assistType,
      provider: formData.provider,
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
      ...(isEdit
        ? {}
        : {
            reservationId,
            currency: formData.currency || Currency.USD,
          }),
    };

    try {
      setLoading(true);
      const endpoint = isEdit ? `/medical-assists/${assist!.id}` : "/medical-assists";
      const method = isEdit ? "PATCH" : "POST";

      const savedAssist = await fetchAPI<MedicalAssist>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedAssist);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({ _general: "Ocurrió un error al guardar la asistencia médica." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false); 
    if (!assist || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/medical-assists/${assist.id}`, { method: "DELETE" });
      onDelete?.(assist.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ _general: err.message || "Error al eliminar asistencia médica." });
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
          if (!isOpen && isDirty) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer"
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
              {assist ? "Editar Asistencia Médica" : "Crear Asistencia Médica"}
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
            {/* Campos principales (Refactorizado con map) */}
            {[
              { id: "provider", label: "Proveedor *", placeholder: "Assist Card" },
              { id: "bookingReference", label: "Referencia de reserva *", placeholder: "ASST-00123" },
              { id: "assistType", label: "Tipo de asistencia", placeholder: "Emergencia médica internacional" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  value={formData[f.id as keyof FormData] as string}
                  onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${
                    errors[f.id as keyof FormData] ? "border-red-500" : ""
                  }`}
                />
                {errors[f.id as keyof FormData] && (
                  <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id as keyof FormData]}</p>
                )}
              </div>
            ))}

            {/* Moneda */}
            {!assist && (
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-[11px] md:text-xs">Moneda *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v: Currency) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger id="currency" className="bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="USD" className="cursor-pointer">USD</SelectItem>
                    <SelectItem value="ARS" className="cursor-pointer">ARS</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-red-500 text-[10px] md:text-xs">{errors.currency}</p>}
              </div>
            )}

            {/* Precios */}
            {[
              { id: "totalPrice", label: "Precio total *", placeholder: "500" },
              { id: "amountPaid", label: "Monto pagado *", placeholder: "300" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} className="text-[11px] md:text-xs">{f.label}</Label>
                <Input
                  id={f.id}
                  type="number"
                  min={0}
                  value={formData[f.id as keyof FormData] as number}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") { setFormData({ ...formData, [f.id]: 0 }); return; }
                    const numValue = Number(value);
                    if (numValue >= 0) { setFormData({ ...formData, [f.id]: numValue }); }
                  }}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "Minus") e.preventDefault(); }}
                  placeholder={f.placeholder}
                  className={`h-8 md:h-9 text-xs md:text-sm ${
                    errors[f.id as keyof FormData] ? "border-red-500" : ""
                  }`}
                />
                {errors[f.id as keyof FormData] && (
                  <p className="text-red-500 text-[10px] md:text-xs">{errors[f.id as keyof FormData]}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {assist && (
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
                disabled={loading || (assist && !isDirty)}
                className="text-xs md:text-sm cursor-pointer"
              >
                {loading ? "Guardando..." : assist ? "Guardar cambios" : "Crear"}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente la asistencia médica.
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