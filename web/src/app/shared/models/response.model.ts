export interface Response<T> {
  status: boolean;
  message: string;
  data: T;
  trace: string;
}

/**
 * Envoltorio de los listados (PaginatedResponseModel del Backend): además de
 * `data` trae la metadata de paginación en la raíz de la respuesta.
 */
export interface PaginatedResponse<T> extends Response<T[]> {
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/** Página de un listado, ya desenvuelta. */
export interface PagedResult<T> {
  data: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}
