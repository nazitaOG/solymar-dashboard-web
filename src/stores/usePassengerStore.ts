import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { fetchAPI } from "@/lib/api/fetchApi";

interface PassengersState {
  passengers: Pax[];
  fetched: boolean; // indica si ya se hizo el fetch inicial
  setPassengers: (list: Pax[]) => void;
  addPassenger: (pax: Pax) => void;
  removePassenger: (id: string) => void;
  clearPassengers: () => void;
  setFetched: (value: boolean) => void;

  /** 🔁 Fetch centralizado (con opción de forzar) */
  fetchPassengers: (force?: boolean) => Promise<void>;

  /** 🔄 Refresca desde backend y reemplaza todo */
  refreshPassengers: () => Promise<void>;
}

export const usePassengersStore = create<PassengersState>()(
  persist(
    (set, get) => ({
      passengers: [],
      fetched: false,

      /**
       * 🔁 Obtiene pasajeros desde el backend.
       * Por defecto evita refetch si ya están cargados.
       * Pasar `force = true` para forzar actualización.
       */
      fetchPassengers: async (force = false) => {
        const { fetched, passengers } = get();
        if (!force && fetched && passengers.length > 0) return;

        try {
          const data = await fetchAPI<Pax[]>("/pax");
          set({ passengers: data, fetched: true });
        } catch (error) {
          console.error("❌ Error al obtener pasajeros:", error);
          set({ fetched: true }); // evita loop infinito
        }
      },

      /**
       * 🔄 Refresca siempre (equivale a fetchPassengers(true))
       */
      refreshPassengers: async () => {
        try {
          const data = await fetchAPI<Pax[]>("/pax");
          set({ passengers: data, fetched: true });
        } catch (error) {
          console.error("❌ Error al refrescar pasajeros:", error);
        }
      },

      /**
       * ✅ Setea lista completa manualmente
       */
      setPassengers: (list) => set({ passengers: list }),

      /**
       * ➕ Agrega pasajero si no existe
       */
      addPassenger: (pax) =>
        set((state) => {
          const exists = state.passengers.some((p) => p.id === pax.id);
          if (exists) return state;
          return { passengers: [...state.passengers, pax] };
        }),

      /**
       * ❌ Elimina pasajero por id
       */
      removePassenger: (id) =>
        set((state) => ({
          passengers: state.passengers.filter((p) => p.id !== id),
        })),

      /**
       * 🧹 Limpia todo el estado local
       */
      clearPassengers: () => set({ passengers: [], fetched: false }),

      /**
       * ⚙️ Marca manualmente el flag de fetch
       */
      setFetched: (value) => set({ fetched: value }),
    }),
    {
      name: "solymar-passengers",
      storage: createJSONStorage(() => sessionStorage),
      version: 2,
      migrate: (persistedState, version) => {
        // 🔸 Limpia la cache vieja si cambia la estructura
        if (version < 2) {
          return { passengers: [], fetched: false };
        }
        return persistedState as PassengersState;
      },
    }
  )
);
