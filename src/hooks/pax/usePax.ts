import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { fetchAPI } from "@/lib/api/fetchApi"
import { Pax } from "@/lib/interfaces/pax/pax.interface"

export interface UsePaxParams {
  page: number
  limit: number
  name?: string
  nationality?: string
  documentFilter?: string
}

interface PaxResponse {
  data: Pax[]
  meta: {
    total: number
    page: number
    limit: number
    hasNext: boolean
    totalPages: number
  }
}

export const usePax = (params: UsePaxParams) => {
  return useQuery({
    // Agregamos 'with-docs' a la key para diferenciar caché
    queryKey: ["pax", params, "with-docs"],

    queryFn: async () => {
      const offset = (params.page - 1) * params.limit

      const queryParams = new URLSearchParams()
      
      queryParams.append("limit", params.limit.toString())
      queryParams.append("offset", offset.toString())
      
      // 👇 AGREGADO: Pedimos siempre los documentos para la tabla
      queryParams.append("include", "dni,passport")
      
      if (params.name) queryParams.append("name", params.name)
      if (params.nationality && params.nationality !== "all") {
        queryParams.append("nationality", params.nationality)
      }
      if (params.documentFilter && params.documentFilter !== "all") {
        queryParams.append("documentFilter", params.documentFilter)
      }

      const data = await fetchAPI<PaxResponse>(`/pax?${queryParams.toString()}`)
      
      return data
    },

    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  })
}