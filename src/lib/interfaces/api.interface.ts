// src/lib/interfaces/api.interface.ts

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    offset: number;
    limit: number;
    total: number;
    totalPages: number;
    page: number;
    hasNext: boolean;
    nextOffset?: number;
  };
}