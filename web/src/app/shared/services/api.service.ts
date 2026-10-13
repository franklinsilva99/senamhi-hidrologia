// noinspection JSUnusedGlobalSymbols

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PagedResult, PaginatedResponse, Response } from '../models/response.model';
import { environment } from '../../../environments/environment';
import { ApiError } from '../errors/api.error';
import { ToolService } from './tool.service';

/**
 * Filas por página al recorrer un listado completo. El Backend acepta páginas
 * grandes y responde igual de rápido; con 1.000 la mayoría de los listados
 * quedan en una sola petición.
 */
const DEFAULT_PAGE_SIZE = 1000;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly toolService = inject(ToolService);

  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = this.buildParams(params);

    return this.http.get<Response<T>>(`${this.baseUrl}/${endpoint}`, { params: httpParams }).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * GET de un listado paginado conservando la metadata (totalElements, etc.).
   * `get()` sirve para el resto: devuelve solo `data` y descarta la paginación.
   */
  getPage<T>(endpoint: string, page = 0, pageSize = 100, params?: any): Observable<PagedResult<T>> {
    return this.http
      .get<PaginatedResponse<T>>(`${this.baseUrl}/${endpoint}`, {
        params: this.buildParams({ ...params, page, pageSize }),
      })
      .pipe(
        map((response) => ({
          data: response.data ?? [],
          totalElements: response.totalElements ?? (response.data ?? []).length,
          totalPages: response.totalPages ?? 1,
          page: response.page ?? page,
          pageSize: response.pageSize ?? pageSize,
        })),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * GET de un listado completo: recorre todas las páginas y concatena.
   *
   * El Backend pagina de a 100 por defecto; pedir el listado sin paginar
   * devolvía solo la primera página y truncaba el catálogo en silencio.
   *
   * Rendimiento (17/09/2026): las páginas siguientes se piden **en paralelo**,
   * no encadenadas. Antes cada página esperaba a la anterior, así que una
   * estación con 1.440 filas costaba ocho viajes en serie; ahora es un viaje
   * más el resto simultáneo. Y la página por defecto pasó de 200 a 1.000
   * filas, que el Backend sirve en el mismo tiempo que 200 (medido contra el
   * entorno local): la mayoría de los listados quedan en una sola petición.
   */
  getAll<T>(endpoint: string, params?: any, pageSize = DEFAULT_PAGE_SIZE): Observable<T[]> {
    return this.getPage<T>(endpoint, 0, pageSize, params).pipe(
      switchMap((first) => {
        const pendientes: Observable<PagedResult<T>>[] = [];
        for (let page = 1; page < first.totalPages; page++) {
          pendientes.push(this.getPage<T>(endpoint, page, pageSize, params));
        }
        if (!pendientes.length) {
          return of(first.data);
        }
        // `forkJoin` conserva el orden del arreglo, así que el listado sale
        // ordenado por página aunque las respuestas lleguen desordenadas.
        return forkJoin(pendientes).pipe(
          map((resto) => resto.reduce((acc, r) => acc.concat(r.data), [...first.data])),
        );
      }),
    );
  }

  post<T>(endpoint: string, body: any, headers?: HttpHeaders): Observable<T> {
    const convertedBody = this.toolService.convertDatesToUTC(body);

    return this.http
      .post<Response<T>>(`${this.baseUrl}/${endpoint}`, convertedBody, { headers })
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError((error) => this.handleError(error)),
      );
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const convertedBody = this.toolService.convertDatesToUTC(body);

    return this.http.put<Response<T>>(`${this.baseUrl}/${endpoint}`, convertedBody).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const convertedBody = this.toolService.convertDatesToUTC(body);

    return this.http.patch<Response<T>>(`${this.baseUrl}/${endpoint}`, convertedBody).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<Response<T>>(`${this.baseUrl}/${endpoint}`).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<Response<T>>(`${this.baseUrl}/${endpoint}`, formData).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  putFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.put<Response<T>>(`${this.baseUrl}/${endpoint}`, formData).pipe(
      map((response) => this.handleApiResponse(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    const converted = this.toolService.convertDatesToUTC(params) as Record<string, any>;
    Object.keys(converted).forEach((key) => {
      const value = converted[key];
      if (value != null && value !== '') {
        httpParams = httpParams.append(key, String(value));
      }
    });
    return httpParams;
  }

  private handleApiResponse<T>(response: Response<T>): T {
    return response.data;
  }

  private handleError(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const errorBody = error.error;

      if (
        errorBody &&
        typeof errorBody === 'object' &&
        errorBody.hasOwnProperty('status') &&
        errorBody.hasOwnProperty('message')
      ) {
        const apiError = new ApiError(true, errorBody.message, errorBody.trace);
        return throwError(() => apiError);
      }

      let apiError: ApiError;

      switch (error.status) {
        case 0:
          apiError = new ApiError(false, ApiError.ERROR_MESSAGE_NOT_INTERNET);
          break;
        case 404:
          apiError = new ApiError(false, ApiError.ERROR_MESSAGE_404);
          break;
        default:
          apiError = new ApiError(false, ApiError.ERROR_MESSAGE_UNEXPECTED);
      }

      return throwError(() => apiError);
    }

    const apiError = new ApiError(false, ApiError.ERROR_MESSAGE_UNEXPECTED);

    return throwError(() => apiError);
  }
}
