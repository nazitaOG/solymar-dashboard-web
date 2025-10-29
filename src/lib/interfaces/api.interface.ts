export interface PaginatedResponse<T> {
  meta: {
    offset: number
    limit: number
    hasNext: boolean
    nextOffset?: number
  }
  data: T[]
}
