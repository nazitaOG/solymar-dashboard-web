import { useState, useEffect, useRef, useTransition } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/custom/date-time-picker";

import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { CreatePaxSchema } from "@/lib/schemas/pax/create-pax.schema";
import { fetchAPI } from "@/lib/api/fetchApi";
import { paxToRequest } from "@/lib/utils/pax/pax_transform.utils";
import type { CreatePaxRequest } from "@/lib/interfaces/pax/pax-request.interface";
import { useDeletePassenger } from "@/hooks/pax/useDeletePassanger";

// ----------------------------------------------------

interface PassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger?: Pax;
  mode: "create" | "edit" | "view";
  linkedReservations?: Array<{ id: string; state: string }>;
  onSave?: (passenger: Pax) => void;
  onDelete?: (id: string) => void;
}

// 🛠️ Definimos el tipo del estado local
interface FormDataState {
  name: string;
  birthDate: Date | undefined;
  nationality: string;
  dniNum: string;
  dniExpirationDate: Date | undefined;
  passportNum: string;
  passportExpirationDate: Date | undefined;
}

// 1. Constante para valores por defecto
const defaultFormData: FormDataState = {
  name: "",
  birthDate: undefined,
  nationality: "Argentina",
  dniNum: "",
  dniExpirationDate: undefined,
  passportNum: "",
  passportExpirationDate: undefined,
};

// 2. Función pura para calcular el estado inicial desde un pasajero
// Esta es la "Single Source of Truth" para la carga de datos
const getInitialData = (pax?: Pax): FormDataState => {
  if (!pax) return defaultFormData;

  const toDate = (value?: string | Date | null): Date | undefined => {
    if (!value) return undefined;
    const d = typeof value === "string" ? new Date(value) : value;
    return isNaN(d.getTime()) ? undefined : d;
  };

  const normalizeNationality = (n?: string) => {
    if (!n) return "Argentina";
    return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
  };

  return {
    name: pax.name ?? "",
    birthDate: toDate(pax.birthDate),
    nationality: normalizeNationality(pax.nationality),
    dniNum: pax.dni?.dniNum || "",
    dniExpirationDate: toDate(pax.dni?.expirationDate),
    passportNum: pax.passport?.passportNum || "",
    passportExpirationDate: toDate(pax.passport?.expirationDate),
  };
};

// 👇 3. NUEVO: Mapeo de placeholders por país (CORREGIDOS)
// Usamos ejemplos con formatos visualmente amigables que Zod sabrá limpiar
const docPlaceholders: Record<string, { dni: string; passport: string }> = {
  Argentina: { dni: "35.123.456", passport: "AAB123456" },
  Uruguay: { dni: "1.234.567-8", passport: "A123456" }, // Guion visual
  Chile: { dni: "12.345.678-K", passport: "A1234567" }, // Guion visual
  Brasil: { dni: "123.456.789-00", passport: "AA123456" },
  Paraguay: { dni: "1234567", passport: "A123456" },
  Perú: { dni: "12345678", passport: "123456789" },
  Bolivia: { dni: "1234567", passport: "A123456" },
  Otro: { dni: "Documento Nac.", passport: "Pasaporte" },
};

export function PassengerDialog({
  open,
  onOpenChange,
  passenger,
  mode,
  onSave,
  onDelete,
}: PassengerDialogProps) {
  const [formData, setFormData] = useState<FormDataState>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Alertas
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Referencia para guardar la "foto" original de los datos
  const initialDataRef = useRef<FormDataState>(defaultFormData);

  const { deletePassenger, isPending: isDeleting, error: deleteError } =
    useDeletePassenger({
      onDeleteSuccess: (id) => {
        onDelete?.(id);
        setShowDeleteConfirm(false);
        onOpenChange(false);
      },
    });

  // 🔄 Cargar datos: Se ejecuta al abrir o cambiar pasajero
  useEffect(() => {
    if (open) {
      // Calculamos los datos iniciales UNA sola vez usando la función pura
      const data = getInitialData(passenger);
      
      // Actualizamos el formulario
      setFormData(data);
      
      // Guardamos la referencia exacta de lo que se cargó
      initialDataRef.current = data;
      
      setErrors({});
    }
  }, [passenger, open]);

  // 4. Dirty Check: Comparamos el estado actual vs la referencia cargada
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);

  // 👇 Calcular placeholders actuales según nacionalidad seleccionada
  const currentPlaceholders =
    docPlaceholders[formData.nationality] || docPlaceholders.Otro;

  const handleSave = () => {
    const zodData = {
      name: formData.name,
      birthDate: formData.birthDate?.toISOString(),
      nationality: formData.nationality,
      dniNum: formData.dniNum || undefined,
      dniExpirationDate: formData.dniExpirationDate?.toISOString() || undefined,
      passportNum: formData.passportNum || undefined,
      passportExpirationDate:
        formData.passportExpirationDate?.toISOString() || undefined,
    };

    const result = CreatePaxSchema.safeParse(zodData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    if (mode === 'edit' && !isDirty) {
        onOpenChange(false); 
        return;
    }

    startTransition(async () => {
      try {
        const normalized: Partial<Pax> = {
          name: result.data.name,
          birthDate: result.data.birthDate.toISOString(),
          nationality: result.data.nationality,
          dni: result.data.dniNum
            ? {
                dniNum: result.data.dniNum,
                expirationDate: result.data.dniExpirationDate
                  ? result.data.dniExpirationDate.toISOString()
                  : undefined,
              }
            : undefined,
          passport: result.data.passportNum
            ? {
                passportNum: result.data.passportNum,
                expirationDate: result.data.passportExpirationDate
                  ? result.data.passportExpirationDate.toISOString()
                  : undefined,
              }
            : undefined,
        };

        const requestBody: CreatePaxRequest = paxToRequest(normalized);

        let saved: Pax;
        if (mode === "create") {
          saved = await fetchAPI<Pax>("/pax", {
            method: "POST",
            body: JSON.stringify(requestBody),
          });
        } else if (mode === "edit" && passenger?.id) {
          saved = await fetchAPI<Pax>(`/pax/${passenger.id}`, {
            method: "PATCH",
            body: JSON.stringify(requestBody),
          });
        } else {
          throw new Error("Modo no válido o pasajero sin ID");
        }

        onSave?.(saved);
        onOpenChange(false);
      } catch (error) {
        const msg =
          error instanceof Error && error.message
            ? error.message
            : "Error al guardar el pasajero. Intenta más tarde.";
        setErrors({ general: msg });
      }
    });
  };

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(isOpen) => {
          // Si intenta cerrar, hay cambios y no es modo vista -> Alerta
          if (!isOpen && isDirty && !isViewMode) {
            setShowDiscardConfirm(true);
          } else {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs md:text-sm [&>button]:cursor-pointer"
          onInteractOutside={(e) => {
            if (isDirty && !isViewMode) {
              e.preventDefault();
              setShowDiscardConfirm(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">
              {isCreateMode
                ? "Crear Pasajero"
                : isViewMode
                ? "Ver Pasajero"
                : "Editar Pasajero"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información básica */}
            <div className="space-y-3">
              <h4 className="font-medium text-xs md:text-sm">Información básica</h4>
              <div className="grid gap-3 md:grid-cols-2">
                
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-[11px] md:text-xs">
                    Nombre completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isViewMode}
                    placeholder="Lionel Andrés Messi"
                    className={`h-8 md:h-9 text-xs md:text-sm ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="birthDate" className="text-[11px] md:text-xs">
                    Fecha de nacimiento *
                  </Label>
                  <div className={isViewMode ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.birthDate}
                      setDate={(date) =>
                        setFormData({ ...formData, birthDate: date })
                      }
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={1900}
                      endYear={new Date().getFullYear()}
                      label="Seleccionar fecha"
                    />
                  </div>
                  {errors.birthDate && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.birthDate}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nationality" className="text-[11px] md:text-xs">
                    Nacionalidad *
                  </Label>
                  <Select
                    value={formData.nationality}
                    onValueChange={(value) =>
                      setFormData({ ...formData, nationality: value })
                    }
                    disabled={isViewMode}
                  >
                    <SelectTrigger
                      id="nationality"
                      className={`bg-transparent h-8 md:h-9 text-xs md:text-sm cursor-pointer ${
                        errors.nationality ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Argentina" />
                    </SelectTrigger>
                    <SelectContent className="text-xs md:text-sm">
                      {Object.keys(docPlaceholders).map((country) => (
                        <SelectItem key={country} value={country} className="cursor-pointer">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.nationality && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.nationality}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* DNI */}
            <div className="space-y-3">
              <h4 className="font-medium text-xs md:text-sm">DNI</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="dniNum" className="text-[11px] md:text-xs">
                    Número de DNI *
                  </Label>
                  <Input
                    id="dniNum"
                    value={formData.dniNum}
                    onChange={(e) =>
                      setFormData({ ...formData, dniNum: e.target.value })
                    }
                    disabled={isViewMode}
                    // 👇 PLACEHOLDER DINÁMICO AQUÍ
                    placeholder={currentPlaceholders.dni}
                    className={`h-8 md:h-9 text-xs md:text-sm ${
                      errors.dniNum ? "border-red-500" : ""
                    }`}
                  />
                  {errors.dniNum && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.dniNum}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dniExpiration" className="text-[11px] md:text-xs">
                    Fecha de vencimiento (Opcional)
                  </Label>
                  <div className={isViewMode ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.dniExpirationDate}
                      setDate={(date) =>
                        setFormData({ ...formData, dniExpirationDate: date })
                      }
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 20}
                      label="Seleccionar fecha"
                    />
                  </div>
                  {errors.dniExpirationDate && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.dniExpirationDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Pasaporte */}
            <div className="space-y-3">
              <h4 className="font-medium text-xs md:text-sm">Pasaporte</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="passportNum" className="text-[11px] md:text-xs">
                    Número de pasaporte *
                  </Label>
                  <Input
                    id="passportNum"
                    value={formData.passportNum}
                    onChange={(e) =>
                      setFormData({ ...formData, passportNum: e.target.value })
                    }
                    disabled={isViewMode}
                    // 👇 PLACEHOLDER DINÁMICO AQUÍ
                    placeholder={currentPlaceholders.passport}
                    className={`h-8 md:h-9 text-xs md:text-sm ${
                      errors.passportNum ? "border-red-500" : ""
                    }`}
                  />
                  {errors.passportNum && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.passportNum}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="passportExpiration" className="text-[11px] md:text-xs">
                    Fecha de vencimiento (Opcional)
                  </Label>
                  <div className={isViewMode ? "opacity-60 pointer-events-none" : "[&>button]:cursor-pointer"}>
                    <DateTimePicker
                      date={formData.passportExpirationDate}
                      setDate={(date) =>
                        setFormData({ ...formData, passportExpirationDate: date })
                      }
                      includeTime={false}
                      showYearNavigation={true}
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 20}
                      label="Seleccionar fecha"
                    />
                  </div>
                  {errors.passportExpirationDate && (
                    <p className="text-red-500 text-[10px] md:text-xs">
                      {errors.passportExpirationDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Errores Generales */}
            {(errors.general || deleteError) && (
              <p className="text-red-500 text-[10px] md:text-xs text-center mt-2">
                {errors.general || deleteError}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex justify-start">
              {!isCreateMode && !isViewMode && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="text-xs md:text-sm cursor-pointer"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (isDirty && !isViewMode) setShowDiscardConfirm(true);
                  else onOpenChange(false);
                }}
                className="text-xs md:text-sm cursor-pointer"
              >
                {isViewMode ? "Cerrar" : "Cancelar"}
              </Button>
              {!isViewMode && (
                <Button
                  onClick={handleSave}
                  disabled={isPending || (!isCreateMode && !isDirty)}
                  className="text-xs md:text-sm cursor-pointer"
                >
                  {isPending
                    ? "Guardando..."
                    : isCreateMode
                    ? "Crear"
                    : "Guardar cambios"}
                </Button>
              )}
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
              Esta acción no se puede deshacer. Esto eliminará permanentemente al pasajero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => passenger?.id && deletePassenger(passenger.id, passenger.name)}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
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