import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { ProgressOverlay } from './progress-overlay';
import { ToolService } from '../../services/tool.service';

describe('ProgressOverlay', () => {
  let fixture: ComponentFixture<ProgressOverlay>;
  // Signals reales que simulan el estado expuesto por ToolService.
  let isLoading: ReturnType<typeof signal<boolean>>;
  let loadingMessage: ReturnType<typeof signal<string>>;

  const overlay = () => fixture.nativeElement.querySelector('.progress-overlay');

  beforeEach(async () => {
    isLoading = signal(false);
    loadingMessage = signal('Procesando…');

    TestBed.configureTestingModule({
      imports: [ProgressOverlay],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ToolService, useValue: { isLoading, loadingMessage } },
      ],
    });
    fixture = TestBed.createComponent(ProgressOverlay);
    await fixture.whenStable();
  });

  it('permanece oculto mientras no hay operaciones en curso', () => {
    expect(overlay()).toBeNull();
  });

  it('aparece con spinner y mensaje cuando isLoading pasa a true', async () => {
    isLoading.set(true);
    await fixture.whenStable();

    const elemento = overlay();
    expect(elemento).not.toBeNull();
    expect(elemento.getAttribute('role')).toBe('alert');
    expect(elemento.getAttribute('aria-busy')).toBe('true');
    expect(elemento.querySelector('p-progressspinner')).not.toBeNull();
    expect(elemento.querySelector('.progress-text').textContent.trim()).toBe('Procesando…');
  });

  it('refleja el mensaje contextual de loadingMessage', async () => {
    isLoading.set(true);
    loadingMessage.set('Guardando estación…');
    await fixture.whenStable();

    expect(overlay().querySelector('.progress-text').textContent.trim()).toBe(
      'Guardando estación…',
    );
  });

  it('actualiza el mensaje si cambia durante la carga', async () => {
    isLoading.set(true);
    loadingMessage.set('Cargando datos…');
    await fixture.whenStable();
    expect(overlay().querySelector('.progress-text').textContent.trim()).toBe('Cargando datos…');

    loadingMessage.set('Generando reporte…');
    await fixture.whenStable();
    expect(overlay().querySelector('.progress-text').textContent.trim()).toBe(
      'Generando reporte…',
    );
  });

  it('desaparece cuando isLoading vuelve a false', async () => {
    isLoading.set(true);
    await fixture.whenStable();
    expect(overlay()).not.toBeNull();

    isLoading.set(false);
    await fixture.whenStable();
    expect(overlay()).toBeNull();
  });
});
