import { Injectable, signal } from '@angular/core';

/** Cómo está respondiendo el Backend, visto desde las consultas a la API. */
export type ServerState = 'ok' | 'retrying' | 'down';

/**
 * Estado de disponibilidad del Backend (09/10/2026).
 *
 * El 09/10/2026 el Backend se quedó sin memoria y siguió «vivo» sin
 * responder: cada pantalla mostraba su propio error genérico y nadie sabía
 * qué pasaba ni si los datos estaban completos. El interceptor
 * `serverUnavailableInterceptor` informa aquí los reintentos, y el layout
 * muestra un único aviso para todo el sistema.
 */
@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  readonly state = signal<ServerState>('ok');
  /** Intento en curso y total de reintentos, para el texto del aviso. */
  readonly attempt = signal(0);
  readonly maxAttempts = signal(0);

  retrying(attempt: number, maxAttempts: number): void {
    this.attempt.set(attempt);
    this.maxAttempts.set(maxAttempts);
    this.state.set('retrying');
  }

  down(): void {
    this.state.set('down');
  }

  ok(): void {
    if (this.state() !== 'ok') {
      this.state.set('ok');
      this.attempt.set(0);
    }
  }
}
