import { TestBed } from '@angular/core/testing';
import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { ApiService } from './api.service';
import { ApiError } from '../errors/api.error';
import { environment } from '../../../environments/environment';

/** Envoltorio estándar del Backend (ResponseModel). */
function wrap<T>(data: T) {
  return { status: true, message: null, trace: null, data };
}

/** Configura el TestBed con los providers mínimos y devuelve servicio y controlador HTTP. */
function setup(): { api: ApiService; http: HttpTestingController } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ApiService,
      MessageService,
      ConfirmationService,
      DialogService,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });
  return { api: TestBed.inject(ApiService), http: TestBed.inject(HttpTestingController) };
}

/** Respuesta paginada del Backend (PaginatedResponseModel). */
function page(data: unknown[], pageIndex: number, totalPages: number, pageSize = 200) {
  return {
    status: true,
    message: null,
    trace: null,
    data,
    totalElements: totalPages * pageSize,
    totalPages,
    page: pageIndex,
    pageSize,
  };
}

describe('ApiService.getAll', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        MessageService,
        ConfirmationService,
        DialogService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('con una sola página emite los datos y no pide más', () => {
    let result: unknown[] | undefined;
    api.getAll<{ id: number }>('stations').subscribe((r) => (result = r));

    http
      .expectOne(`${environment.apiUrl}/stations?page=0&pageSize=1000`)
      .flush(page([{ id: 1 }], 0, 1));

    expect(result).toEqual([{ id: 1 }]);
  });

  it('pide las páginas siguientes en paralelo y concatena en orden', () => {
    let result: { id: number }[] | undefined;
    api.getAll<{ id: number }>('variables').subscribe((r) => (result = r));

    http
      .expectOne(`${environment.apiUrl}/variables?page=0&pageSize=1000`)
      .flush(page([{ id: 1 }], 0, 3));

    // Las dos siguientes salen juntas, sin esperar una a la otra.
    const segunda = http.expectOne(`${environment.apiUrl}/variables?page=1&pageSize=1000`);
    const tercera = http.expectOne(`${environment.apiUrl}/variables?page=2&pageSize=1000`);
    // Se responden al revés para comprobar que el orden lo da la página.
    tercera.flush(page([{ id: 3 }], 2, 3));
    segunda.flush(page([{ id: 2 }], 1, 3));

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('con el listado vacío emite un arreglo vacío', () => {
    let result: unknown[] | undefined;
    api.getAll('pollutants').subscribe((r) => (result = r));

    http.expectOne(`${environment.apiUrl}/pollutants?page=0&pageSize=1000`).flush(page([], 0, 0));

    expect(result).toEqual([]);
  });

  it('conserva los filtros propios del endpoint en cada página', () => {
    api.getAll('consolidated-history', { dateFrom: '2026-08-01T00:00:00' }).subscribe();

    const first = http.expectOne(
      (r) => r.url === `${environment.apiUrl}/consolidated-history` && r.params.get('page') === '0',
    );
    expect(first.request.params.get('dateFrom')).toBe('2026-08-01T00:00:00');
    first.flush(page([{ id: 1 }], 0, 2));

    const second = http.expectOne(
      (r) => r.url === `${environment.apiUrl}/consolidated-history` && r.params.get('page') === '1',
    );
    expect(second.request.params.get('dateFrom')).toBe('2026-08-01T00:00:00');
    second.flush(page([{ id: 2 }], 1, 2));
  });

  it('trata una respuesta sin metadata como una única página', () => {
    let result: unknown[] | undefined;
    api.getAll('tests').subscribe((r) => (result = r));

    http
      .expectOne(`${environment.apiUrl}/tests?page=0&pageSize=1000`)
      .flush({ status: true, message: null, trace: null, data: [{ id: 7 }] });

    expect(result).toEqual([{ id: 7 }]);
  });
});

describe('ApiService.get', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('desenvuelve el data del ResponseModel', () => {
    let result: { id: number } | undefined;
    api.get<{ id: number }>('stations/1').subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/stations/1`);
    expect(req.request.method).toBe('GET');
    req.flush(wrap({ id: 1 }));

    expect(result).toEqual({ id: 1 });
  });

  it('omite los params null o vacíos y conserva el resto (incluido el 0)', () => {
    api.get('stations', { name: 'Ate', empty: '', nothing: null, page: 0 }).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/stations`);
    expect(req.request.params.get('name')).toBe('Ate');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.has('empty')).toBe(false);
    expect(req.request.params.has('nothing')).toBe(false);
    req.flush(wrap(null));
  });

  it('serializa los Date de los params con el formato ISO con sufijo Z', () => {
    api.get('history', { from: new Date(2026, 0, 15, 10, 30, 0, 0) }).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/history`);
    expect(req.request.params.get('from')).toBe('2026-01-15T10:30:00.000Z');
    req.flush(wrap([]));
  });
});

describe('ApiService: manejo de errores', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('con ResponseModel de error crea un ApiError conocido con message y trace del backend', () => {
    let capturado: unknown;
    api.get('stations').subscribe({ error: (e) => (capturado = e) });

    http
      .expectOne(`${environment.apiUrl}/stations`)
      .flush(
        { status: false, message: 'El registro ya existe', trace: 'stack' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(capturado).toBeInstanceOf(ApiError);
    const apiError = capturado as ApiError;
    expect(apiError.isKnow).toBe(true);
    expect(apiError.message).toBe('El registro ya existe');
    expect(apiError.trace).toBe('stack');
  });

  it('un fallo de red (status 0) se traduce al mensaje de sin conexión', () => {
    let capturado: unknown;
    api.get('stations').subscribe({ error: (e) => (capturado = e) });

    http.expectOne(`${environment.apiUrl}/stations`).error(new ProgressEvent('error'));

    expect(capturado).toBeInstanceOf(ApiError);
    const apiError = capturado as ApiError;
    expect(apiError.isKnow).toBe(false);
    expect(apiError.message).toBe(ApiError.ERROR_MESSAGE_NOT_INTERNET);
  });

  it('un 404 sin cuerpo conocido se traduce al mensaje de recurso no encontrado', () => {
    let capturado: unknown;
    api.get('stations/99').subscribe({ error: (e) => (capturado = e) });

    http
      .expectOne(`${environment.apiUrl}/stations/99`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect((capturado as ApiError).message).toBe(ApiError.ERROR_MESSAGE_404);
  });

  it('cualquier otro status sin cuerpo conocido usa el mensaje inesperado', () => {
    let capturado: unknown;
    api.get('stations').subscribe({ error: (e) => (capturado = e) });

    http
      .expectOne(`${environment.apiUrl}/stations`)
      .flush('Internal error', { status: 500, statusText: 'Server Error' });

    expect((capturado as ApiError).message).toBe(ApiError.ERROR_MESSAGE_UNEXPECTED);
  });
});

describe('ApiService.post', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('envía el body con las fechas convertidas y desenvuelve el data', () => {
    let result: { id: number } | undefined;
    api
      .post<{ id: number }>('stations', {
        name: 'Ate',
        createdAt: new Date(2026, 0, 15, 10, 30, 0, 0),
      })
      .subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/stations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Ate', createdAt: '2026-01-15T10:30:00.000Z' });
    req.flush(wrap({ id: 10 }));

    expect(result).toEqual({ id: 10 });
  });

  it('propaga los headers personalizados', () => {
    api.post('reports', {}, new HttpHeaders({ 'X-Report-Type': 'monthly' })).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/reports`);
    expect(req.request.headers.get('X-Report-Type')).toBe('monthly');
    req.flush(wrap(null));
  });

  it('mapea los errores del backend igual que en get', () => {
    let capturado: unknown;
    api.post('stations', {}).subscribe({ error: (e) => (capturado = e) });

    http
      .expectOne(`${environment.apiUrl}/stations`)
      .flush(
        { status: false, message: 'Datos inválidos', trace: null },
        { status: 400, statusText: 'Bad Request' },
      );

    expect((capturado as ApiError).message).toBe('Datos inválidos');
  });
});

describe('ApiService.put / patch / delete', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('put envía el body con fechas convertidas y desenvuelve el data', () => {
    let result: { ok: boolean } | undefined;
    api
      .put<{ ok: boolean }>('stations/5', { updatedAt: new Date(2026, 6, 1, 8, 0, 0, 0) })
      .subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/stations/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ updatedAt: '2026-07-01T08:00:00.000Z' });
    req.flush(wrap({ ok: true }));

    expect(result).toEqual({ ok: true });
  });

  it('patch usa el método PATCH y desenvuelve el data', () => {
    let result: { ok: boolean } | undefined;
    api.patch<{ ok: boolean }>('stations/5', { active: false }).subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/stations/5`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ active: false });
    req.flush(wrap({ ok: true }));

    expect(result).toEqual({ ok: true });
  });

  it('delete usa el método DELETE sin body y desenvuelve el data', () => {
    let result: { deleted: boolean } | undefined;
    api.delete<{ deleted: boolean }>('stations/5').subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/stations/5`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush(wrap({ deleted: true }));

    expect(result).toEqual({ deleted: true });
  });
});

describe('ApiService.postFormData / putFormData', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('postFormData envía el FormData sin transformarlo y desenvuelve el data', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['contenido']), 'datos.csv');

    let result: { id: number } | undefined;
    api.postFormData<{ id: number }>('uploads', formData).subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/uploads`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);
    req.flush(wrap({ id: 3 }));

    expect(result).toEqual({ id: 3 });
  });

  it('putFormData usa el método PUT con el mismo FormData', () => {
    const formData = new FormData();

    api.putFormData('uploads/3', formData).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/uploads/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBe(formData);
    req.flush(wrap(null));
  });
});

describe('ApiService.getPage', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => ({ api, http } = setup()));
  afterEach(() => http.verify());

  it('conserva la metadata de paginación que envía el backend', () => {
    let result: unknown;
    api.getPage('stations', 2, 50).subscribe((r) => (result = r));

    http.expectOne(`${environment.apiUrl}/stations?page=2&pageSize=50`).flush({
      status: true,
      message: null,
      trace: null,
      data: [{ id: 1 }],
      totalElements: 120,
      totalPages: 3,
      page: 2,
      pageSize: 50,
    });

    expect(result).toEqual({
      data: [{ id: 1 }],
      totalElements: 120,
      totalPages: 3,
      page: 2,
      pageSize: 50,
    });
  });

  it('completa la metadata ausente con valores por defecto', () => {
    let result: unknown;
    api.getPage('stations').subscribe((r) => (result = r));

    http
      .expectOne(`${environment.apiUrl}/stations?page=0&pageSize=100`)
      .flush({ status: true, message: null, trace: null, data: null });

    expect(result).toEqual({
      data: [],
      totalElements: 0,
      totalPages: 1,
      page: 0,
      pageSize: 100,
    });
  });
});
