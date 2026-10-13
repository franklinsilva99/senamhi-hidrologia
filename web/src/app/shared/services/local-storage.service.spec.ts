import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new LocalStorageService();
    // El servicio loguea los errores por consola; se silencian para no ensuciar la salida.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('setItem / getItem', () => {
    it('guarda y recupera un objeto serializado como JSON', () => {
      service.setItem('usuario', { id: 7, nombre: 'Ana' });

      expect(localStorage.getItem('usuario')).toBe('{"id":7,"nombre":"Ana"}');
      expect(service.getItem('usuario')).toEqual({ id: 7, nombre: 'Ana' });
    });

    it('guarda y recupera valores primitivos', () => {
      service.setItem('contador', 42);
      service.setItem('activo', false);

      expect(service.getItem('contador')).toBe(42);
      expect(service.getItem('activo')).toBe(false);
    });

    it('devuelve el valor por defecto cuando la clave no existe', () => {
      expect(service.getItem('inexistente', 'fallback')).toBe('fallback');
    });

    it('devuelve undefined cuando la clave no existe y no hay valor por defecto', () => {
      expect(service.getItem('inexistente')).toBeUndefined();
    });

    it('devuelve el valor por defecto si el contenido almacenado no es JSON válido', () => {
      localStorage.setItem('roto', '{esto no es json');

      expect(service.getItem('roto', { ok: true })).toEqual({ ok: true });
      expect(console.error).toHaveBeenCalled();
    });

    it('no revienta si el valor no se puede serializar (referencia circular)', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;

      expect(() => service.setItem('circular', circular)).not.toThrow();
      expect(localStorage.getItem('circular')).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('revivido de fechas', () => {
    it('convierte de vuelta a Date las propiedades guardadas como Date', () => {
      const fecha = new Date(2026, 7, 31, 10, 30, 0, 123);
      service.setItem('registro', { creadoEn: fecha, nombre: 'obs' });

      const recuperado = service.getItem<{ creadoEn: Date; nombre: string }>('registro');

      expect(recuperado?.creadoEn).toBeInstanceOf(Date);
      expect(recuperado?.creadoEn.getTime()).toBe(fecha.getTime());
      expect(recuperado?.nombre).toBe('obs');
    });

    it('convierte cadenas ISO sin milisegundos y sin sufijo Z', () => {
      localStorage.setItem('config', JSON.stringify({ desde: '2026-01-15T10:30:00' }));

      const recuperado = service.getItem<{ desde: Date }>('config');

      expect(recuperado?.desde).toBeInstanceOf(Date);
      expect(recuperado?.desde.getFullYear()).toBe(2026);
    });

    it('revive fechas en objetos anidados dentro de arreglos', () => {
      localStorage.setItem(
        'listado',
        JSON.stringify({ items: [{ fecha: '2026-03-01T00:00:00.000Z' }] }),
      );

      const recuperado = service.getItem<{ items: { fecha: Date }[] }>('listado');

      expect(recuperado?.items[0].fecha).toBeInstanceOf(Date);
    });

    it('deja como cadena un texto con formato de fecha pero valores imposibles', () => {
      localStorage.setItem('sospechoso', JSON.stringify({ fecha: '2026-13-45T99:99:99Z' }));

      const recuperado = service.getItem<{ fecha: unknown }>('sospechoso');

      expect(recuperado?.fecha).toBe('2026-13-45T99:99:99Z');
    });

    it('no toca cadenas que no siguen el patrón ISO', () => {
      localStorage.setItem('textos', JSON.stringify({ nota: '31/08/2026', hora: '10:30' }));

      expect(service.getItem('textos')).toEqual({ nota: '31/08/2026', hora: '10:30' });
    });

    it('no convierte una cadena ISO guardada como valor de nivel superior (comportamiento actual)', () => {
      // convertStringsToDates solo revisa propiedades de objetos: un string suelto se devuelve tal cual.
      service.setItem('soloFecha', '2026-01-15T10:30:00.000Z');

      expect(service.getItem('soloFecha')).toBe('2026-01-15T10:30:00.000Z');
    });

    it('no convierte cadenas ISO que son elementos directos de un arreglo (comportamiento actual)', () => {
      // Los elementos string de un arreglo pasan por convertStringsToDates, que solo
      // transforma strings cuando son valores de propiedades de un objeto.
      service.setItem('fechas', ['2026-01-15T10:30:00.000Z']);

      expect(service.getItem('fechas')).toEqual(['2026-01-15T10:30:00.000Z']);
    });

    it('conserva null y no lo confunde con clave ausente', () => {
      service.setItem('nulo', null);

      expect(service.getItem('nulo', 'default')).toBeNull();
    });
  });

  describe('removeItem / clear', () => {
    it('elimina solo la clave indicada', () => {
      service.setItem('a', 1);
      service.setItem('b', 2);

      service.removeItem('a');

      expect(service.getItem('a')).toBeUndefined();
      expect(service.getItem('b')).toBe(2);
    });

    it('limpia todo el almacenamiento', () => {
      service.setItem('a', 1);
      service.setItem('b', 2);

      service.clear();

      expect(localStorage).toHaveLength(0);
    });
  });
});
