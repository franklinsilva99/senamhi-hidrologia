import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, tap, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ServerStatusService } from '../services/server-status.service';

/** Reintentos ante un Backend que no responde, y espera entre cada uno. */
export const SERVER_RETRIES = 3;
export const SERVER_RETRY_DELAY_MS = 15_000;

/**
 * Sin respuesta (0) o pasarela caída o vencida (502, 503, 504): el Backend no
 * está disponible, no es un error de la consulta.
 */
export function isServerUnavailable(error: unknown): boolean {
  const status = (error as HttpErrorResponse)?.status;
  return status === 0 || status === 502 || status === 503 || status === 504;
}

/**
 * Reintenta las lecturas cuando el Backend no responde y avisa al usuario
 * (09/10/2026; ver `ServerStatusService`).
 *
 * Solo se reintentan las lecturas (GET): repetir un guardado podría duplicar
 * una calificación. Un guardado que falla igual se informa en el aviso.
 */
export const serverUnavailableInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const status = inject(ServerStatusService);
  const isRead = req.method === 'GET';

  return next(req).pipe(
    retry({
      count: isRead ? SERVER_RETRIES : 0,
      delay: (error, attempt) => {
        if (!isServerUnavailable(error)) {
          return throwError(() => error);
        }
        status.retrying(attempt, SERVER_RETRIES);
        return timer(SERVER_RETRY_DELAY_MS);
      },
    }),
    tap(() => status.ok()),
    catchError((error: unknown) => {
      if (isServerUnavailable(error)) {
        status.down();
      }
      return throwError(() => error);
    }),
  );
};
