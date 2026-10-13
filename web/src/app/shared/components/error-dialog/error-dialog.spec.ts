import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { describe, it, expect, vi } from 'vitest';

import { ErrorDialog } from './error-dialog';
import { ApiError } from '../../errors/api.error';

interface DatosDialogo {
  message?: string;
  trace?: string;
}

/** Configura el TestBed con la data del diálogo y devuelve la fixture creada. */
function crear(data?: DatosDialogo): {
  fixture: ComponentFixture<ErrorDialog>;
  componente: ErrorDialog;
  dialogRef: { close: ReturnType<typeof vi.fn> };
} {
  const dialogRef = { close: vi.fn() };
  TestBed.configureTestingModule({
    imports: [ErrorDialog],
    providers: [
      provideZonelessChangeDetection(),
      { provide: DynamicDialogRef, useValue: dialogRef },
      { provide: DynamicDialogConfig, useValue: { data } },
    ],
  });
  const fixture = TestBed.createComponent(ErrorDialog);
  return { fixture, componente: fixture.componentInstance, dialogRef };
}

describe('ErrorDialog (interpretación del mensaje)', () => {
  it('separa código y mensaje en el primer ":" preservando los ":" internos', async () => {
    const { fixture, componente } = crear({
      message: 'ERR-500: Fallo interno: revise el log',
    });
    await fixture.whenStable();

    expect(componente.code).toBe('ERR-500');
    expect(componente.message).toBe('Fallo interno: revise el log');
  });

  it('traduce el código de excepción de base de datos', async () => {
    const { fixture, componente } = crear({ message: 'pe.gob.senamhi.exception.database' });
    await fixture.whenStable();

    expect(componente.message).toBe(
      'Se ha encontrado un error al interactuar con la base de datos.',
    );
    expect(componente.code).toBeUndefined();
  });

  it('traduce el código de excepción del adaptador', async () => {
    const { fixture, componente } = crear({ message: 'pe.gob.senamhi.exception.adapter' });
    await fixture.whenStable();

    expect(componente.message).toBe('La respuesta de la API no tiene el formato esperado');
  });

  it('usa el mensaje genérico para códigos no catalogados sin ":"', async () => {
    const { fixture, componente } = crear({ message: 'pe.gob.senamhi.exception.desconocida' });
    await fixture.whenStable();

    expect(componente.message).toBe(ApiError.ERROR_MESSAGE_UNEXPECTED);
  });

  it('un código catalogado seguido de ":" no pasa por el catálogo (se trata como código+detalle)', async () => {
    const { fixture, componente } = crear({
      message: 'pe.gob.senamhi.exception.database: ORA-00001',
    });
    await fixture.whenStable();

    expect(componente.code).toBe('pe.gob.senamhi.exception.database');
    expect(componente.message).toBe('ORA-00001');
  });

  it('recorta los espacios del trace', async () => {
    const { fixture, componente } = crear({ message: 'ERR: x', trace: '  at Service.load()  \n' });
    await fixture.whenStable();

    expect(componente.trace).toBe('at Service.load()');
  });

  it('deja el trace undefined si no viene en la data', async () => {
    const { fixture, componente } = crear({ message: 'ERR: x' });
    await fixture.whenStable();

    expect(componente.trace).toBeUndefined();
  });

  it('sin data en la configuración no interpreta nada ni falla', async () => {
    const { fixture, componente } = crear(undefined);
    await fixture.whenStable();

    expect(componente.message).toBeUndefined();
    expect(componente.code).toBeUndefined();
    expect(componente.trace).toBeUndefined();
  });

  it('data sin message no falla: usa el mensaje genérico, sin código, y conserva el trace', async () => {
    const { fixture, componente } = crear({ trace: 'solo trace' });
    await fixture.whenStable();

    expect(componente.message).toBe(ApiError.ERROR_MESSAGE_UNEXPECTED);
    expect(componente.code).toBeUndefined();
    expect(componente.trace).toBe('solo trace');
  });

  it('message vacío se trata como ausente: mensaje genérico y sin código', async () => {
    const { fixture, componente } = crear({ message: '' });
    await fixture.whenStable();

    expect(componente.message).toBe(ApiError.ERROR_MESSAGE_UNEXPECTED);
    expect(componente.code).toBeUndefined();
  });

  it('getMessage resuelve códigos conocidos y cae al genérico con los demás', async () => {
    const { fixture, componente } = crear({ message: 'ERR: x' });
    await fixture.whenStable();

    expect(componente.getMessage('pe.gob.senamhi.exception.adapter')).toBe(
      'La respuesta de la API no tiene el formato esperado',
    );
    expect(componente.getMessage('otra cosa')).toBe(ApiError.ERROR_MESSAGE_UNEXPECTED);
  });
});

describe('ErrorDialog (render y cierre)', () => {
  it('muestra mensaje, código de excepción y detalles técnicos', async () => {
    const { fixture } = crear({
      message: 'ERR-409: El registro ya existe',
      trace: 'at Repository.save()',
    });
    await fixture.whenStable();
    const nativo: HTMLElement = fixture.nativeElement;

    expect(nativo.querySelector('p')?.textContent?.trim()).toBe('El registro ya existe');
    expect(nativo.querySelector('small')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Código de excepción: ERR-409.',
    );
    const fieldset = nativo.querySelector('p-fieldset');
    expect(fieldset).not.toBeNull();
    expect(fieldset?.textContent).toContain('at Repository.save()');
  });

  it('sin código ni trace solo renderiza el mensaje y el botón de cierre', async () => {
    const { fixture } = crear({ message: 'pe.gob.senamhi.exception.database' });
    await fixture.whenStable();
    const nativo: HTMLElement = fixture.nativeElement;

    expect(nativo.querySelector('small')).toBeNull();
    expect(nativo.querySelector('p-fieldset')).toBeNull();
    expect(nativo.querySelector('p-button')).not.toBeNull();
  });

  it('el botón Cerrar cierra el diálogo dinámico', async () => {
    const { fixture, dialogRef } = crear({ message: 'ERR: x' });
    await fixture.whenStable();

    fixture.nativeElement.querySelector('p-button button')?.click();
    await fixture.whenStable();

    expect(dialogRef.close).toHaveBeenCalledOnce();
  });
});
