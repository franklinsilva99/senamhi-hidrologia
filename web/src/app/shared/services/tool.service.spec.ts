import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, beforeEach, afterEach, it, expect, vi, type MockInstance } from 'vitest';
import { MessageService, type ToastMessageOptions } from 'primeng/api';
import { DialogService, type DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';

import { ToolService } from './tool.service';
import { ApiError } from '../errors/api.error';
import { Constants } from '../models/constants';

describe('ToolService', () => {
  let service: ToolService;
  let addSpy: MockInstance;
  let dialogService: DialogService;

  /** Último toast agregado vía MessageService.add. */
  const lastToast = (): ToastMessageOptions => addSpy.mock.calls.at(-1)?.[0];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ToolService, MessageService, DialogService],
    });
    service = TestBed.inject(ToolService);
    addSpy = vi.spyOn(TestBed.inject(MessageService), 'add');
    dialogService = TestBed.inject(DialogService);
    // handleError traza todos los errores por consola; se silencia para la corrida.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute', () => {
    it('activa isLoading durante la acción y lo apaga al terminar', async () => {
      let cargandoDurante = false;

      expect(service.isLoading()).toBe(false);
      await service.execute(async () => {
        cargandoDurante = service.isLoading();
      });

      expect(cargandoDurante).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('muestra el mensaje recibido y lo restaura al terminar', async () => {
      let mensajeDurante = '';

      await service.execute(
        async () => {
          mensajeDurante = service.loadingMessage();
        },
        undefined,
        'Cargando estaciones…',
      );

      expect(mensajeDurante).toBe('Cargando estaciones…');
      expect(service.loadingMessage()).toBe('Procesando…');
    });

    it('con ejecuciones superpuestas mantiene el loading y el mensaje hasta que termina la última', async () => {
      let liberarPrimera!: () => void;
      let liberarSegunda!: () => void;

      const primera = service.execute(
        () => new Promise<void>((res) => (liberarPrimera = res)),
        undefined,
        'Cargando estaciones…',
      );
      const segunda = service.execute(() => new Promise<void>((res) => (liberarSegunda = res)));

      expect(service.isLoading()).toBe(true);
      expect(service.loadingMessage()).toBe('Cargando estaciones…');

      liberarPrimera();
      await primera;

      // Todavía queda una acción en curso: ni el loading ni el mensaje se restauran.
      expect(service.isLoading()).toBe(true);
      expect(service.loadingMessage()).toBe('Cargando estaciones…');

      liberarSegunda();
      await segunda;

      expect(service.isLoading()).toBe(false);
      expect(service.loadingMessage()).toBe('Procesando…');
    });

    it('ante un error devuelve el contador a 0, muestra toast y ejecuta actionOnError', async () => {
      const actionOnError = vi.fn();

      await service.execute(async () => {
        throw new ApiError(true, 'Fallo controlado');
      }, actionOnError);

      expect(service.isLoading()).toBe(false);
      expect(actionOnError).toHaveBeenCalledTimes(1);
      expect(lastToast()).toMatchObject({
        severity: 'error',
        summary: 'No se pudo completar la operación',
        detail: 'Fallo controlado',
        life: 7000,
      });
    });

    it('no propaga el error: la promesa devuelta siempre resuelve', async () => {
      await expect(
        service.execute(async () => {
          throw new Error('explota');
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('manejo de errores', () => {
    const ejecutarConError = (error: unknown, actionOnError?: () => void) =>
      service.execute(async () => {
        throw error;
      }, actionOnError);

    it('un error de sesión no autorizada muestra advertencia con el mensaje 401', async () => {
      const actionOnError = vi.fn();

      await ejecutarConError(
        new Error('pe.gob.senamhi.exception.unauthorized: acceso denegado'),
        actionOnError,
      );

      expect(lastToast()).toMatchObject({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: ApiError.ERROR_MESSAGE_401,
      });
      expect(actionOnError).toHaveBeenCalledTimes(1);
    });

    it('un token expirado muestra advertencia con el mensaje de sesión expirada', async () => {
      await ejecutarConError(new Error('pe.gob.senamhi.exception.token.expired'));

      expect(lastToast()).toMatchObject({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: ApiError.ERROR_MESSAGE_TOKEN_EXPIRED,
      });
    });

    it('quita el prefijo "Error interno en el servidor:" del mensaje de un ApiError', async () => {
      await ejecutarConError(
        new ApiError(true, 'Error interno en el servidor: La estación ya existe'),
      );

      expect(lastToast().detail).toBe('La estación ya existe');
    });

    it('quita prefijos técnicos encadenados (excepción Java y código HV)', async () => {
      await ejecutarConError(
        new ApiError(true, 'com.example.ValidationException: HV000030: El valor es inválido'),
      );

      expect(lastToast().detail).toBe('El valor es inválido');
    });

    it('limpia los nombres de campo de las validaciones y elimina duplicados', async () => {
      await ejecutarConError(
        new ApiError(
          true,
          'nomenclature: La nomenclatura es obligatoria; nomenclature: La nomenclatura es obligatoria; code.min: Debe ser mayor a cero',
        ),
      );

      expect(lastToast().detail).toBe('La nomenclatura es obligatoria; Debe ser mayor a cero');
    });

    it('si el mensaje queda vacío tras la limpieza usa el mensaje genérico', async () => {
      await ejecutarConError(new ApiError(true, 'Error interno en el servidor: '));

      expect(lastToast().detail).toBe(Constants.ERROR_MESSAGE);
    });

    it('recorta con elipsis los mensajes de más de 220 caracteres', async () => {
      await ejecutarConError(new ApiError(true, 'x'.repeat(300)));

      const detail = lastToast().detail as string;
      expect(detail).toHaveLength(220);
      expect(detail.endsWith('…')).toBe(true);
    });

    it('usa el message del backend cuando un HttpErrorResponse trae ResponseModel', async () => {
      await ejecutarConError(
        new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: { status: false, message: 'El registro ya existe', trace: null },
        }),
      );

      expect(lastToast().detail).toBe('El registro ya existe');
    });

    it('sin message del backend usa el mensaje genérico según el código HTTP', async () => {
      const casos: [number, string][] = [
        [0, ApiError.ERROR_MESSAGE_NOT_INTERNET],
        [400, 'Los datos enviados no son válidos. Revise la información e intente nuevamente.'],
        [422, 'Los datos enviados no son válidos. Revise la información e intente nuevamente.'],
        [401, ApiError.ERROR_MESSAGE_401],
        [403, 'No tiene permisos para realizar esta acción.'],
        [404, ApiError.ERROR_MESSAGE_404],
        [500, 'Ocurrió un error en el servidor. Intente nuevamente más tarde.'],
        [503, ApiError.ERROR_MESSAGE_UNEXPECTED],
      ];

      for (const [status, esperado] of casos) {
        await ejecutarConError(new HttpErrorResponse({ status, statusText: 'x' }));
        expect(lastToast().detail, `status ${status}`).toBe(esperado);
      }
    });

    it('un valor lanzado que no es Error muestra el mensaje genérico', async () => {
      await ejecutarConError('cadena lanzada');

      expect(lastToast()).toMatchObject({
        severity: 'error',
        detail: Constants.ERROR_MESSAGE,
      });
    });
  });

  describe('executeWithFormValidator', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        nombre: new FormControl<string | null>(null, Validators.required),
      });
    });

    it('con formulario inválido no ejecuta la acción, marca los controles y advierte', async () => {
      const action = vi.fn(async () => undefined);

      await service.executeWithFormValidator(form, action);

      expect(action).not.toHaveBeenCalled();
      expect(form.controls['nombre'].dirty).toBe(true);
      expect(form.controls['nombre'].touched).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(lastToast()).toMatchObject({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: 'Verifique los campos ingresados.',
      });
    });

    it('con formulario válido ejecuta la acción con loading activo y sin toasts', async () => {
      form.controls['nombre'].setValue('Estación Ate');
      let cargandoDurante = false;

      await service.executeWithFormValidator(form, async () => {
        cargandoDurante = service.isLoading();
      });

      expect(cargandoDurante).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('con formulario válido y acción fallida devuelve el contador a 0 y notifica el error', async () => {
      form.controls['nombre'].setValue('Estación Ate');
      const actionOnError = vi.fn();

      await service.executeWithFormValidator(
        form,
        async () => {
          throw new ApiError(true, 'Fallo al guardar');
        },
        actionOnError,
      );

      expect(service.isLoading()).toBe(false);
      expect(actionOnError).toHaveBeenCalledTimes(1);
      expect(lastToast()).toMatchObject({ severity: 'error', detail: 'Fallo al guardar' });
    });
  });

  describe('mensajes directos', () => {
    it('showSuccessMessage sin detalle usa el mensaje de éxito por defecto', () => {
      service.showSuccessMessage();

      expect(lastToast()).toEqual({
        severity: 'success',
        summary: Constants.SUCCESS_TITLE,
        detail: Constants.SUCCESS_MESSAGE,
      });
    });

    it('showSuccessMessage con detalle personalizado lo respeta', () => {
      service.showSuccessMessage('Estación registrada.');

      expect(lastToast().detail).toBe('Estación registrada.');
    });

    it('showWarningMessage arma un toast de advertencia con el detalle recibido', () => {
      service.showWarningMessage('Sin resultados para el filtro.');

      expect(lastToast()).toEqual({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: 'Sin resultados para el filtro.',
      });
    });
  });

  describe('openForm / openFormAndWait', () => {
    class ComponenteFalso {}

    it('abre el diálogo con las opciones por defecto', () => {
      const openSpy = vi
        .spyOn(dialogService, 'open')
        .mockReturnValue({} as unknown as DynamicDialogRef);

      service.openForm(ComponenteFalso, 'Nueva estación');

      expect(openSpy).toHaveBeenCalledWith(
        ComponenteFalso,
        expect.objectContaining({
          header: 'Nueva estación',
          width: '30vw',
          modal: true,
          draggable: false,
          closable: true,
          focusOnShow: false,
          data: {},
        }),
      );
    });

    it('las opciones recibidas pisan a las opciones por defecto', () => {
      const openSpy = vi
        .spyOn(dialogService, 'open')
        .mockReturnValue({} as unknown as DynamicDialogRef);

      service.openForm(ComponenteFalso, 'Editar', { width: '60vw', data: { id: 5 } });

      expect(openSpy).toHaveBeenCalledWith(
        ComponenteFalso,
        expect.objectContaining({ header: 'Editar', width: '60vw', data: { id: 5 } }),
      );
    });

    it('openFormAndWait resuelve con el valor emitido al cerrar el diálogo', async () => {
      vi.spyOn(dialogService, 'open').mockReturnValue({
        onClose: of({ guardado: true }),
      } as unknown as DynamicDialogRef);

      const resultado = await service.openFormAndWait(ComponenteFalso, 'Confirmar');

      expect(resultado).toEqual({ guardado: true });
    });
  });

  describe('unwrapSettled', () => {
    it('devuelve el valor cuando la promesa se cumplió', () => {
      const settled: PromiseSettledResult<number> = { status: 'fulfilled', value: 10 };

      expect(service.unwrapSettled(settled, -1)).toBe(10);
    });

    it('devuelve el fallback cuando la promesa fue rechazada', () => {
      const settled: PromiseSettledResult<number> = { status: 'rejected', reason: new Error('x') };

      expect(service.unwrapSettled(settled, -1)).toBe(-1);
    });
  });

  describe('convertDatesToUTC', () => {
    it('formatea un Date con patrón ISO y sufijo Z', () => {
      // Nota: date-fns format usa la hora local de la máquina y agrega la "Z" como
      // literal, así que el instante NO se traslada a UTC (comportamiento actual).
      const fecha = new Date(2026, 0, 15, 10, 30, 0, 123);

      expect(service.convertDatesToUTC(fecha)).toBe('2026-01-15T10:30:00.123Z');
    });

    it('convierte fechas anidadas en objetos y arreglos sin mutar el resto', () => {
      const payload = {
        nombre: 'obs',
        rango: { desde: new Date(2026, 5, 1, 0, 0, 0, 0), activo: true },
        marcas: [new Date(2026, 5, 2, 12, 0, 0, 0), 7, null],
      };

      expect(service.convertDatesToUTC(payload)).toEqual({
        nombre: 'obs',
        rango: { desde: '2026-06-01T00:00:00.000Z', activo: true },
        marcas: ['2026-06-02T12:00:00.000Z', 7, null],
      });
    });

    it('devuelve intactos los primitivos, null y undefined', () => {
      expect(service.convertDatesToUTC('texto')).toBe('texto');
      expect(service.convertDatesToUTC(42)).toBe(42);
      expect(service.convertDatesToUTC(null)).toBeNull();
      expect(service.convertDatesToUTC(undefined)).toBeUndefined();
    });
  });
});
