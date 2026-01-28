import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

// Interfaces y Utils
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { CreatePaxSchema } from "@/lib/schemas/pax/create-pax.schema";
import { paxToRequest } from "@/lib/utils/pax/pax_transform.utils";

// Hooks
import { useCreatePax, useUpdatePax } from "@/hooks/pax/usePaxMutations";

// ----------------------------------------------------

interface PassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger?: Pax;
  mode: "create" | "edit" | "view";
  onSuccess?: (savedPax: Pax) => void;
}

interface FormDataState {
  name: string;
  birthDate: Date | undefined;
  nationality: string;
  email: string;
  phoneNumber: string;
  dniNum: string;
  dniExpirationDate: Date | undefined;
  passportNum: string;
  passportExpirationDate: Date | undefined;
}

const defaultFormData: FormDataState = {
  name: "",
  birthDate: undefined,
  nationality: "Argentina",
  email: "",
  phoneNumber: "",
  dniNum: "",
  dniExpirationDate: undefined,
  passportNum: "",
  passportExpirationDate: undefined,
};

const getInitialData = (pax?: Pax): FormDataState => {
  if (!pax) return defaultFormData;

  const toDate = (value?: string | Date | null): Date | undefined => {
    if (!value) return undefined;
    const d = typeof value === "string" ? new Date(value) : value;
    return isNaN(d.getTime()) ? undefined : d;
  };

  const normalizeNationality = (n?: string) => {
    if (!n) return "Argentina";
    const upper = n.toUpperCase();
    const map: Record<string, string> = {
      ARGENTINA: "Argentina", URUGUAY: "Uruguay", CHILE: "Chile", BRASIL: "Brasil",
      PARAGUAY: "Paraguay", PERU: "Perú", PERÚ: "Perú", BOLIVIA: "Bolivia",
    };
    return map[upper] || "Otro";
  };

  return {
    name: pax.name ?? "",
    birthDate: toDate(pax.birthDate),
    nationality: normalizeNationality(pax.nationality),
    email: pax.email ?? "",
    phoneNumber: pax.phoneNumber ?? "",
    dniNum: pax.dni?.dniNum || "",
    dniExpirationDate: toDate(pax.dni?.expirationDate),
    passportNum: pax.passport?.passportNum || "",
    passportExpirationDate: toDate(pax.passport?.expirationDate),
  };
};

const docPlaceholders: Record<string, { dni: string; passport: string }> = {
  Argentina: { dni: "Ej: 35.123.456", passport: "Ej: AAA123456" },
  Uruguay: { dni: "Ej: 1.234.567-8", passport: "Ej: AA123456" },
  Chile: { dni: "Ej: 12.345.678-K", passport: "Ej: 12345678" },
  Brasil: { dni: "Ej: 123.456.789-00", passport: "Ej: AB123456" },
  Paraguay: { dni: "Ej: 1234567", passport: "Ej: AA012345" },
  Perú: { dni: "Ej: 12345678", passport: "Ej: 123456789" },
  Bolivia: { dni: "Ej: 1234567", passport: "Ej: AA12345" },
  Otro: { dni: "Nro. Documento", passport: "Nro. Pasaporte" },
};

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
  mode,
  onSuccess,
}: PassengerDialogProps) {
  const [formData, setFormData] = useState<FormDataState>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const initialDataRef = useRef<FormDataState>(defaultFormData);

  // Hooks de mutación
  const createMutation = useCreatePax();
  const updateMutation = useUpdatePax();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      const data = getInitialData(passenger);
      setFormData(data);
      initialDataRef.current = data;
      setErrors({});
    } else {
      setFormData(defaultFormData);
      initialDataRef.current = defaultFormData;
      setErrors({});
      setShowDiscardConfirm(false);
      createMutation.reset();
      updateMutation.reset();
    }
  }, [passenger, open]);

  const isDirty = useMemo(() => {
    if (!open) return false;
    const normalize = (data: FormDataState) => ({
      name: data.name?.trim() || "",
      birthDate: data.birthDate?.getTime() ?? 0,
      nationality: data.nationality || "Argentina",
      email: data.email?.trim() || "",
      phoneNumber: data.phoneNumber?.trim() || "",
      dniNum: data.dniNum?.trim() || "",
      dniExpirationDate: data.dniExpirationDate?.getTime() ?? 0,
      passportNum: data.passportNum?.trim() || "",
      passportExpirationDate: data.passportExpirationDate?.getTime() ?? 0,
    });
    const current = JSON.stringify(normalize(formData));
    const initial = JSON.stringify(normalize(initialDataRef.current));
    return current !== initial;
  }, [formData, open]);

  // ✅ SOLUCIÓN 1: Aquí definimos la variable
  const currentPlaceholders =
    docPlaceholders[formData.nationality] || docPlaceholders.Otro;

  const handleSave = async () => {
    const payloadForZod = {
      name: formData.name,
      birthDate: formData.birthDate ? formData.birthDate.toISOString() : "",
      nationality: formData.nationality,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      passportNum: formData.passportNum,
      passportExpirationDate: formData.passportExpirationDate || "",
      dniNum: formData.dniNum,
      dniExpirationDate: formData.dniExpirationDate || "",
    };

    const result = CreatePaxSchema.safeParse(payloadForZod);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (mode === "edit" && !isDirty) {
      onOpenChange(false);
      return;
    }

    const normalizedData = {
      name: result.data.name,
      birthDate: result.data.birthDate.toISOString(),
      nationality: result.data.nationality,
      email: result.data.email || undefined,
      phoneNumber: result.data.phoneNumber || undefined,
      dni: result.data.dniNum
        ? { dniNum: result.data.dniNum, expirationDate: result.data.dniExpirationDate?.toISOString() }
        : undefined,
      passport: result.data.passportNum
        ? { passportNum: result.data.passportNum, expirationDate: result.data.passportExpirationDate?.toISOString() }
        : undefined,
    };

    const requestBody = paxToRequest(normalizedData);

    try {
      let savedPax: Pax;

      if (mode === "create") {
        savedPax = await createMutation.mutateAsync(requestBody);
      } else if (mode === "edit" && passenger?.id) {
        savedPax = await updateMutation.mutateAsync({
          id: passenger.id,
          data: requestBody,
        });
      } else {
        throw new Error("Modo inválido o falta ID");
      }

      onSuccess?.(savedPax);
      onOpenChange(false);

      // ✅ SOLUCIÓN 2: Eliminamos el 'any' y usamos 'unknown'
    } catch (error: unknown) {
      let msg = "Error al guardar.";

      // Verificamos si es una instancia de Error
      const rawMsg = error instanceof Error ? error.message : String(error);

      if (rawMsg.includes("unique constraint") && rawMsg.includes("dniNum")) {
        msg = "Ya existe un pasajero registrado con este DNI.";
      } else if (rawMsg.includes("unique constraint") && rawMsg.includes("passportNum")) {
        msg = "Ya existe un pasajero registrado con este Pasaporte.";
      } else {
        msg = rawMsg;
      }
      setErrors({ general: msg });
    }
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (isSaving) return;
          if (!isOpen && isDirty && !isViewMode) {
            setShowDiscardConfirm(true);
          } else if (!isOpen) {
            onOpenChange(false);
          }
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg text-xs md:text-sm [&>button]:cursor-pointer scrollbar-thin"
          onWheel={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            if (isSaving) { e.preventDefault(); return; }
            if (isDirty && !isViewMode) { e.preventDefault(); setShowDiscardConfirm(true); }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isCreateMode ? "Crear Pasajero" : isViewMode ? "Ver Pasajero" : "Editar Pasajero"}
            </DialogTitle>
            <DialogDescription className="text-[11px] md:text-xs">
              {isViewMode ? "Detalles del pasajero." : "Ingresa los datos personales."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* DATOS BÁSICOS */}
            <div className="space-y-3">
              <h4 className="font-medium text-xs md:text-sm">Información básica</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-[11px] md:text-xs">Nombre completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    placeholder="Lionel Andres Messi"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isViewMode || isSaving}
                    className={`h-8 md:h-9 text-xs md:text-sm ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-red-500 text-[10px]">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs">Fecha de nacimiento *</Label>
                  <div className={isViewMode || isSaving ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.birthDate}
                      setDate={(date) => setFormData({ ...formData, birthDate: date })}
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={1900}
                      endYear={new Date().getFullYear()}
                    />
                  </div>
                  {errors.birthDate && <p className="text-red-500 text-[10px]">{errors.birthDate}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs">Nacionalidad *</Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(v) => setFormData({ ...formData, nationality: v })}
                    disabled={isViewMode || isSaving}
                  >
                    <SelectTrigger className={`bg-transparent cursor-pointer h-8 md:h-9 text-xs md:text-sm ${errors.nationality ? "border-red-500" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(docPlaceholders).map((c) => (
                        <SelectItem key={c} value={c} className="text-xs cursor-pointer md:text-sm">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.nationality && <p className="text-red-500 text-[10px]">{errors.nationality}</p>}
                </div>
              </div>
            </div>

            {/* CONTACTO */}
            <div className="pt-2">
              <h4 className="font-medium text-xs md:text-sm">Contacto</h4>
              <div className="grid gap-3 pt-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[11px] md:text-xs">Email <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    placeholder="ejemplo@correo.com"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isViewMode || isSaving}
                    className={`h-8 md:h-9 text-xs md:text-sm ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" className="text-[11px] md:text-xs">Teléfono <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    placeholder="+54 9 11 1234 5678"
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={isViewMode || isSaving}
                    className={`h-8 md:h-9 text-xs md:text-sm ${errors.phoneNumber ? "border-red-500" : ""}`}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-[10px]">{errors.phoneNumber}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* DOCUMENTACIÓN */}
            <div className="space-y-3">
              <h4 className="font-medium text-xs md:text-sm">Documentación</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="dniNum" className="text-[11px] md:text-xs">Número de DNI *</Label>
                  <Input
                    id="dniNum"
                    value={formData.dniNum}
                    onChange={(e) => setFormData({ ...formData, dniNum: e.target.value })}
                    disabled={isViewMode || isSaving}
                    // ✅ SOLUCIÓN 1: Aquí usamos la variable que estaba sin usar
                    placeholder={currentPlaceholders.dni}
                    className={`h-8 md:h-9 text-xs md:text-sm placeholder:text-[10px] md:placeholder:text-xs ${errors.dniNum ? "border-red-500" : ""}`}
                  />
                  {errors.dniNum && <p className="text-red-500 text-[10px]">{errors.dniNum}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs">Vencimiento DNI *</Label>
                  <div className={isViewMode || isSaving ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.dniExpirationDate}
                      setDate={(date) => setFormData({ ...formData, dniExpirationDate: date })}
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 20}
                    />
                  </div>
                  {errors.dniExpirationDate && <p className="text-red-500 text-[10px]">{errors.dniExpirationDate}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="passportNum" className="text-[11px] md:text-xs">Número de pasaporte *</Label>
                  <Input
                    id="passportNum"
                    value={formData.passportNum}
                    onChange={(e) => setFormData({ ...formData, passportNum: e.target.value })}
                    disabled={isViewMode || isSaving}
                    // ✅ SOLUCIÓN 1: Aquí usamos la variable que estaba sin usar
                    placeholder={currentPlaceholders.passport}
                    className={`h-8 md:h-9 text-xs md:text-sm placeholder:text-[10px] md:placeholder:text-xs ${errors.passportNum ? "border-red-500" : ""}`}
                  />
                  {errors.passportNum && <p className="text-red-500 text-[10px]">{errors.passportNum}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs">Vencimiento Pasaporte *</Label>
                  <div className={isViewMode || isSaving ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.passportExpirationDate}
                      setDate={(date) => setFormData({ ...formData, passportExpirationDate: date })}
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 20}
                    />
                  </div>
                  {errors.passportExpirationDate && <p className="text-red-500 text-[10px]">{errors.passportExpirationDate}</p>}
                </div>
              </div>
            </div>

            {errors.general && (
              <p className="text-red-500 text-[10px] md:text-xs text-center mt-2 font-medium bg-red-50 p-2 rounded-md border border-red-100">
                {errors.general}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              className="h-8 md:h-9 text-xs md:text-sm cursor-pointer"
              disabled={isSaving}
              onClick={() => {
                if (isDirty && !isViewMode) setShowDiscardConfirm(true);
                else onOpenChange(false);
              }}
            >
              {isViewMode ? "Cerrar" : "Cancelar"}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={isSaving || (!isCreateMode && !isDirty)}
                className="h-8 md:h-9 text-xs md:text-sm cursor-pointer"
              >
                {isSaving
                  ? "Guardando..."
                  : isCreateMode
                    ? "Crear"
                    : "Guardar cambios"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>Se perderán los datos ingresados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" onClick={() => setShowDiscardConfirm(false)}>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowDiscardConfirm(false); onOpenChange(false); }}
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