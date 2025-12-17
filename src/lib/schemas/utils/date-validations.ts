interface DateRangeObj {
  startDate?: string | null;
  endDate?: string | null;
  departureDate?: string | null;
  arrivalDate?: string | null;
  pickupDate?: string | null;
  dropoffDate?: string | null;
}

// ----------------------------------------------------------------------
// 1. Lógica de las Validaciones
// ----------------------------------------------------------------------

/**
 * Valida solo el ORDEN: Fin >= Inicio
 */
export const validateEndAfterStart = (data: DateRangeObj) => {
  const startStr = data.startDate || data.departureDate || data.pickupDate;
  const endStr = data.endDate || data.arrivalDate || data.dropoffDate;

  if (!startStr || !endStr) return true;

  const start = new Date(startStr);
  const end = new Date(endStr);

  return end >= start;
};

/**
 * Valida la DURACIÓN: Diferencia >= 1 hora
 */
export const validateMinOneHourGap = (data: DateRangeObj) => {
  const startStr = data.startDate || data.departureDate || data.pickupDate;
  const endStr = data.endDate || data.arrivalDate || data.dropoffDate;

  if (!startStr || !endStr) return true;

  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const oneHourInMs = 60 * 60 * 1000;

  return (end - start) >= oneHourInMs;
};

// ----------------------------------------------------------------------
// 2. Configs para ERROR DE ORDEN (Invertidas)
// ----------------------------------------------------------------------

export const endDateErrorConfig = {
  message: "La fecha de salida no puede ser anterior a la de entrada",
  path: ["endDate"],
};

export const dropoffDateErrorConfig = {
  message: "La fecha de devolución no puede ser anterior a la de retiro",
  path: ["dropoffDate"],
};

export const arrivalDateErrorConfig = {
  message: "La fecha de llegada no puede ser anterior a la de salida",
  path: ["arrivalDate"],
};

// ----------------------------------------------------------------------
// 3. Configs para ERROR DE DURACIÓN (Mínimo 1 hora)
// ----------------------------------------------------------------------

export const dropoffDateMinDurationErrorConfig = {
  message: "Debe haber al menos 1 hora de diferencia para la devolución",
  path: ["dropoffDate"],
};

export const arrivalDateMinDurationErrorConfig = {
  message: "Debe haber al menos 1 hora de diferencia entre salida y llegada",
  path: ["arrivalDate"],
};