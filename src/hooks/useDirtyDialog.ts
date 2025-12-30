import { useEffect, useRef, useState } from "react";

type DialogMode = "create" | "edit" | "view";

interface UseDirtyDialogProps<T> {
  open: boolean;
  data?: unknown;
  mode: DialogMode;
  getInitialData: (data?: unknown) => T;
}

export function useDirtyDialog<T>({
  open,
  data,
  mode,
  getInitialData,
}: UseDirtyDialogProps<T>) {
  const [formData, setFormData] = useState<T>(() => getInitialData(data));
  const initialRef = useRef<T>(getInitialData(data));

  useEffect(() => {
    if (!open) return;

    const initial = getInitialData(data);
    setFormData(initial);
    initialRef.current = initial;
  }, [open, data, getInitialData]);

  const isViewMode = mode === "view";

  const isDirty =
    !isViewMode &&
    JSON.stringify(formData) !== JSON.stringify(initialRef.current);

  const resetDirty = () => {
    initialRef.current = formData;
  };

  const shouldConfirmClose = isDirty && !isViewMode;

  return {
    formData,
    setFormData,
    isDirty,
    resetDirty,
    shouldConfirmClose,
  };
}
