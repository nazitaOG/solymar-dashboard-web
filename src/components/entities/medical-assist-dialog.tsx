import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

// 🧩 Tipado derivado del schema
type FormData = Omit<z.input<typeof createMedicalAssistSchema>, "reservationId">;

interface FormErrors extends Partial<Record<keyof FormData, string>> {
  _general?: string;
}

export function MedicalAssistDialog({
  open,
  onOpenChange,
  assist,
  reservationId,
  onSave,
  onDelete,
}: MedicalAssistDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    bookingReference: "",
    assistType: "",
    provider: "",
    totalPrice: 0,
    amountPaid: 0,
    currency: Currency.USD,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const deleteLock = useRef(false);

  // 🧩 Prellenar datos al abrir
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
      setFormData({
        bookingReference: "",
        assistType: "",
        provider: "",
        totalPrice: 0,
        amountPaid: 0,
        currency: Currency.USD,
      });
    }
  }, [assist, open]);

  // 🧭 Comparar si hubo cambios
  const hasChanges = useMemo(() => {
    if (!assist) return true;
    return !(
      formData.bookingReference === (assist.bookingReference ?? "") &&
      formData.assistType === (assist.assistType ?? "") &&
      formData.provider === assist.provider &&
      Number(formData.totalPrice) === Number(assist.totalPrice) &&
      Number(formData.amountPaid) === Number(assist.amountPaid)
    );
  }, [formData, assist]);

  // 💾 Guardar (creación o edición)
  const handleSave = async () => {
    const isEdit = Boolean(assist);
    const schema = isEdit ? updateMedicalAssistSchema : createMedicalAssistSchema;

    // 🚫 Si es edición y no hay cambios
    if (isEdit && !hasChanges) {
      setErrors({
        _general: "Debes modificar al menos un campo para guardar los cambios.",
      });
      return;
    }

    // 🧩 Validar datos
    const result = schema.safeParse({
      ...formData,
      ...(isEdit ? {} : { reservationId }),
      totalPrice: Number(formData.totalPrice),
      amountPaid: Number(formData.amountPaid),
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const err of result.error.issues) {
        const key = err.path[0] as keyof FormData;
        fieldErrors[key] = err.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (Number(formData.totalPrice) < Number(formData.amountPaid)) {
      setErrors({
        amountPaid: "El monto pagado no puede ser mayor que el total.",
      });
      return;
    }

    const payload = {
      bookingReference: formData.bookingReference || null,
      // ⬇️ Quitamos "|| null" para assistType (ya lo tenías así)
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
      const endpoint = isEdit
        ? `/medical-assists/${assist!.id}`
        : "/medical-assists";
      const method = isEdit ? "PATCH" : "POST";

      const savedAssist = await fetchAPI<MedicalAssist>(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSave(savedAssist);
      setTimeout(() => onOpenChange(false), 100);
    } catch {
      setErrors({
        _general:
          "Ocurrió un error al guardar la asistencia médica. Inténtalo nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar
  const handleDelete = async () => {
    if (!assist || deleteLock.current) return;
    deleteLock.current = true;

    try {
      setLoading(true);
      await fetchAPI<void>(`/medical-assists/${assist.id}`, { method: "DELETE" });
      onDelete?.(assist.id);
      setTimeout(() => onOpenChange(false), 150);
    } catch (err) {
      console.error("❌ Error al eliminar asistencia médica:", err);
      if (err instanceof Error) {
        setErrors({
          _general: err.message || "Error al eliminar asistencia médica.",
        });
      }
    } finally {
      deleteLock.current = false;
      setLoading(false);
    }
  };

  // 🧱 Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm">
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
          {/* Campos principales */}
          {[
            { id: "provider", label: "Proveedor *", placeholder: "Assist Card" },
            {
              id: "bookingReference",
              label: "Referencia de reserva *",
              placeholder: "ASST-00123",
            },
            {
              id: "assistType",
              label: "Tipo de asistencia",
              placeholder: "Emergencia médica internacional",
            },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label
                htmlFor={f.id}
                className="text-[11px] md:text-xs"
              >
                {f.label}
              </Label>
              <Input
                id={f.id}
                value={formData[f.id as keyof FormData] as string | number}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
                className={`h-8 md:h-9 text-xs md:text-sm ${
                  errors[f.id as keyof FormData] ? "border-red-500" : ""
                }`}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors[f.id as keyof FormData]}
                </p>
              )}
            </div>
          ))}

          {/* Moneda solo en creación */}
          {!assist && (
            <div className="space-y-1">
              <Label
                htmlFor="currency"
                className="text-[11px] md:text-xs"
              >
                Moneda *
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(v: Currency) =>
                  setFormData({ ...formData, currency: v })
                }
              >
                <SelectTrigger
                  id="currency"
                  className="bg-transparent h-8 md:h-9 text-xs md:text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs md:text-sm">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors.currency}
                </p>
              )}
            </div>
          )}

          {/* Precios */}
          {[
            { id: "totalPrice", label: "Precio total *", placeholder: "500" },
            { id: "amountPaid", label: "Monto pagado *", placeholder: "300" },
          ].map((f) => (
            <div key={f.id} className="space-y-1">
              <Label
                htmlFor={f.id}
                className="text-[11px] md:text-xs"
              >
                {f.label}
              </Label>
              <Input
                id={f.id}
                type="number"
                value={formData[f.id as keyof FormData] as string | number}
                onChange={(e) =>
                  setFormData({ ...formData, [f.id]: e.target.value })
                }
                placeholder={f.placeholder}
                className={`h-8 md:h-9 text-xs md:text-sm ${
                  errors[f.id as keyof FormData] ? "border-red-500" : ""
                }`}
              />
              {errors[f.id as keyof FormData] && (
                <p className="text-red-500 text-[10px] md:text-xs">
                  {errors[f.id as keyof FormData]}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex justify-start">
            {assist && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="text-xs md:text-sm"
              >
                {loading ? "Eliminando..." : "Eliminar"}
              </Button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs md:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || (assist && !hasChanges)}
              className="text-xs md:text-sm"
            >
              {loading
                ? "Guardando..."
                : assist
                ? hasChanges
                  ? "Guardar cambios"
                  : "Sin cambios"
                : "Crear"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
