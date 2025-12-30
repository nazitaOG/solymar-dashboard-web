import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import { fetchAPI } from "@/lib/api/fetchApi";

interface PassengersState {
  passengers: Pax[];
  fetched: boolean;
  loading: boolean; // 👈 Agregado para control de flujo
  setPassengers: (list: Pax[]) => void;
  addPassenger: (pax: Pax) => void;
  updatePassenger: (pax: Pax) => void;
  removePassenger: (id: string) => void;
  clearPassengers: () => void;
  setFetched: (value: boolean) => void;
  fetchPassengers: (force?: boolean) => Promise<void>;
  refreshPassengers: () => Promise<void>;
}

export const usePassengersStore = create<PassengersState>()(
  persist(
    (set, get) => ({
      passengers: [],
      fetched: false,
      loading: false,

      /** 🔁 Fetch inteligente con Sincronización Background */
      fetchPassengers: async (force = false) => {
        const { fetched, passengers, loading } = get();
        
        // Si ya está cargando, no hacer nada
        if (loading) return;

        // Si ya hay datos y no es forzado, actualizamos en background
        if (!force && fetched && passengers.length > 0) {
          get().refreshPassengers();
          return;
        }

        try {
          set({ loading: true });
          const data = await fetchAPI<Pax[]>("/pax");
          set({ passengers: data, fetched: true });
        } catch (error) {
          console.error("❌ Error al obtener pasajeros:", error);
          set({ fetched: true });
        } finally {
          set({ loading: false });
        }
      },

      /** 🔄 Sincronización silenciosa (Stale-While-Revalidate) */
      refreshPassengers: async () => {
        // No refrescar si ya hay una petición en curso
        if (get().loading) return;

        try {
          const data = await fetchAPI<Pax[]>("/pax");
          const currentDataStr = JSON.stringify(get().passengers);
          const newDataStr = JSON.stringify(data);
          
          if (currentDataStr !== newDataStr) {
            set({ passengers: data, fetched: true });
          }
        } catch (error) {
          console.error("❌ Error al refrescar pasajeros:", error);
        }
      },

      addPassenger: (pax) =>
        set((state) => {
          const exists = state.passengers.some((p) => p.id === pax.id);
          if (exists) return state;
          return { passengers: [pax, ...state.passengers] };
        }),

      updatePassenger: (updatedPax) =>
        set((state) => ({
          passengers: state.passengers.map((p) =>
            p.id === updatedPax.id ? updatedPax : p
          ),
        })),

      removePassenger: (id) =>
        set((state) => ({
          passengers: state.passengers.filter((p) => p.id !== id),
        })),

      clearPassengers: () => set({ passengers: [], fetched: false, loading: false }),
      setFetched: (value) => set({ fetched: value }),
      setPassengers: (list) => set({ passengers: list }),
    }),
    {
      name: "solymar-passengers",
      storage: createJSONStorage(() => sessionStorage),
      version: 2,
      // 🛡️ Parte de lo que faltaba: No persistir el estado 'loading' ni 'fetched'
      // Queremos que al abrir una pestaña nueva, siempre intente validar.
      partialize: (state) => ({
        passengers: state.passengers,
      }),
      migrate: (persistedState, version) => {
        if (version < 2) {
          return { passengers: [], fetched: false, loading: false };
        }
        return persistedState as PassengersState;
      },
    }
  )
);