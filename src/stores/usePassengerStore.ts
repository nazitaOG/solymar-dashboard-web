import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { fetchAPI } from "@/lib/api/fetchApi";

interface PassengersState {
  passengers: Pax[];
  fetched: boolean; // 👈 indica si ya se hizo el fetch inicial
  setPassengers: (list: Pax[]) => void;
  addPassenger: (pax: Pax) => void;
  removePassenger: (id: string) => void;
  clearPassengers: () => void;
  setFetched: (value: boolean) => void;
  fetchPassengers: () => Promise<void>; // 👈 nueva acción centralizada
}

export const usePassengersStore = create<PassengersState>()(
  persist(
    (set, get) => ({
      passengers: [],
      fetched: false,

      // ✅ Carga inicial solo si no fue hecha antes
      fetchPassengers: async () => {
        if (get().fetched && get().passengers.length > 0) return;

        try {
          const data = await fetchAPI<Pax[]>("/pax");
          set({ passengers: data, fetched: true });
        } catch (error) {
          console.error("❌ Error al obtener pasajeros:", error);
          // si falla, marcamos fetched para evitar loop infinito
          set({ fetched: true });
        }
      },

      setPassengers: (list) => set({ passengers: list }),

      addPassenger: (pax) =>
        set((state) => {
          const exists = state.passengers.some((p) => p.id === pax.id);
          if (exists) return state;
          return { passengers: [...state.passengers, pax] };
        }),

      removePassenger: (id) =>
        set((state) => ({
          passengers: state.passengers.filter((p) => p.id !== id),
        })),

      clearPassengers: () => set({ passengers: [], fetched: false }),

      setFetched: (value) => set({ fetched: value }),
    }),
    {
      name: "solymar-passengers",
      storage: createJSONStorage(() => sessionStorage), // ✅ scoped por sesión
    }
  )
);
