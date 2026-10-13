import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { environment } from '../../../environments/environment';
import { ServerStatusService } from '../services/server-status.service';
import {
  SERVER_RETRIES,
  SERVER_RETRY_DELAY_MS,
  serverUnavailableInterceptor,
} from './server-unavailable.interceptor';

describe('serverUnavailableInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let status: ServerStatusService;
  const url = `${environment.apiUrl}/stations`;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([serverUnavailableInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    status = TestBed.inject(ServerStatusService);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  const caido = { status: 504, statusText: 'Gateway Timeout' };

  it('reintenta una lectura cuando el servidor no responde y avisa; al volver, quita el aviso', () => {
    let datos: unknown;
    http.get(url).subscribe((d) => (datos = d));

    backend.expectOne(url).flush(null, caido);
    expect(status.state()).toBe('retrying');
    expect(status.attempt()).toBe(1);

    vi.advanceTimersByTime(SERVER_RETRY_DELAY_MS);
    backend.expectOne(url).flush([{ id: 1 }]);

    expect(datos).toEqual([{ id: 1 }]);
    expect(status.state()).toBe('ok');
  });

  it('agotados los reintentos, avisa que el servidor no responde y entrega el error', () => {
    let error: { status?: number } | undefined;
    http.get(url).subscribe({ error: (e) => (error = e) });

    backend.expectOne(url).flush(null, caido);
    for (let i = 0; i < SERVER_RETRIES; i++) {
      vi.advanceTimersByTime(SERVER_RETRY_DELAY_MS);
      backend.expectOne(url).flush(null, caido);
    }

    expect(error?.status).toBe(504);
    expect(status.state()).toBe('down');
  });

  it('no reintenta un guardado (podría duplicarlo), pero igual avisa', () => {
    let error: { status?: number } | undefined;
    http.put(url, {}).subscribe({ error: (e) => (error = e) });

    backend.expectOne(url).flush(null, { status: 502, statusText: 'Bad Gateway' });
    vi.advanceTimersByTime(SERVER_RETRY_DELAY_MS * 2);
    backend.expectNone(url);

    expect(error?.status).toBe(502);
    expect(status.state()).toBe('down');
  });

  it('no reintenta los errores propios de la consulta (400, 401, 403, 500)', () => {
    for (const s of [400, 401, 403, 500]) {
      http.get(url).subscribe({ error: () => undefined });
      backend.expectOne(url).flush(null, { status: s, statusText: 'x' });
      vi.advanceTimersByTime(SERVER_RETRY_DELAY_MS);
      backend.expectNone(url);
    }
    expect(status.state()).toBe('ok');
  });

  it('no toca las consultas que no son de la API (SSO, recursos)', () => {
    http
      .get('https://servicios.senamhi.gob.pe/sso/api/url-auth')
      .subscribe({ error: () => undefined });
    backend.expectOne('https://servicios.senamhi.gob.pe/sso/api/url-auth').flush(null, caido);
    vi.advanceTimersByTime(SERVER_RETRY_DELAY_MS);
    backend.expectNone(() => true);
    expect(status.state()).toBe('ok');
  });
});
