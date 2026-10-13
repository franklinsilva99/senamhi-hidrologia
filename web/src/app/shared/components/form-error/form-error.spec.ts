import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { describe, beforeEach, it, expect } from 'vitest';

import { FormError } from './form-error';

@Component({
  imports: [FormError],
  template: `<app-form-error [control]="control" [customMessages]="customMessages" />`,
})
class HostComponent {
  control: AbstractControl | null = null;
  customMessages: Record<string, string> = {};
}

/** Crea un control tocado con los errores indicados (setErrors manual). */
function controlTocadoCon(errors: Record<string, unknown>): FormControl {
  const control = new FormControl('');
  control.setErrors(errors);
  control.markAsTouched();
  return control;
}

describe('FormError (lógica de errorMessage)', () => {
  let componente: FormError;

  beforeEach(() => {
    componente = new FormError();
  });

  it('devuelve undefined sin control asignado', () => {
    expect(componente.errorMessage).toBeUndefined();
  });

  it('devuelve undefined si el control tiene errores pero no fue tocado', () => {
    const control = new FormControl('', Validators.required);
    control.updateValueAndValidity();
    componente.control = control;

    expect(control.errors).toEqual({ required: true });
    expect(componente.errorMessage).toBeUndefined();
  });

  it('devuelve undefined si el control fue tocado pero es válido', () => {
    const control = new FormControl('valor');
    control.markAsTouched();
    componente.control = control;

    expect(componente.errorMessage).toBeUndefined();
  });

  it('traduce el error required', () => {
    componente.control = controlTocadoCon({ required: true });
    expect(componente.errorMessage).toBe('Este campo es obligatorio.');
  });

  it('interpola la longitud máxima en maxlength', () => {
    componente.control = controlTocadoCon({
      maxlength: { requiredLength: 10, actualLength: 15 },
    });
    expect(componente.errorMessage).toBe('No puede superar 10 caracteres.');
  });

  it('interpola la longitud mínima en minlength', () => {
    componente.control = controlTocadoCon({
      minlength: { requiredLength: 4, actualLength: 2 },
    });
    expect(componente.errorMessage).toBe('Debe tener al menos 4 caracteres.');
  });

  it('interpola los límites en min y max', () => {
    componente.control = controlTocadoCon({ min: { min: 0, actual: -1 } });
    expect(componente.errorMessage).toBe('El valor mínimo es 0.');

    componente.control = controlTocadoCon({ max: { max: 100, actual: 200 } });
    expect(componente.errorMessage).toBe('El valor máximo es 100.');
  });

  it('traduce email, pattern y mismatch', () => {
    componente.control = controlTocadoCon({ email: true });
    expect(componente.errorMessage).toBe('Correo electrónico inválido.');

    componente.control = controlTocadoCon({ pattern: { requiredPattern: '^\\d+$' } });
    expect(componente.errorMessage).toBe('No cumple con el formato requerido.');

    componente.control = controlTocadoCon({ mismatch: true });
    expect(componente.errorMessage).toBe('Los valores no coinciden.');
  });

  it('usa el mensaje genérico para errores no contemplados', () => {
    componente.control = controlTocadoCon({ validadorRaro: true });
    expect(componente.errorMessage).toBe('Campo inválido.');
  });

  it('prioriza el mensaje personalizado sobre el estándar', () => {
    componente.customMessages = { required: 'La nomenclatura es obligatoria.' };
    componente.control = controlTocadoCon({ required: true });
    expect(componente.errorMessage).toBe('La nomenclatura es obligatoria.');
  });

  it('solo informa el primer error cuando hay varios', () => {
    componente.control = controlTocadoCon({
      required: true,
      minlength: { requiredLength: 4, actualLength: 0 },
    });
    expect(componente.errorMessage).toBe('Este campo es obligatorio.');
  });
});

describe('FormError (render)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('no renderiza nada sin error visible', () => {
    expect(fixture.nativeElement.querySelector('small')).toBeNull();
  });

  it('muestra el mensaje en un <small> cuando el control tocado tiene error', async () => {
    host.control = controlTocadoCon({ required: true });
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    const small = fixture.nativeElement.querySelector('small');
    expect(small).not.toBeNull();
    expect(small.textContent.trim()).toBe('Este campo es obligatorio.');
  });

  it('oculta el mensaje cuando el error se corrige', async () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    host.control = control;
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('small')).not.toBeNull();

    control.setValue('ya tiene valor');
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('small')).toBeNull();
  });
});
