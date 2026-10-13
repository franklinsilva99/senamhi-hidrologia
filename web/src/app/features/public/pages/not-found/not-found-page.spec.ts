import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { NotFoundPage } from './not-found-page';

describe('NotFoundPage (ruta comodín 404)', () => {
  let fixture: ComponentFixture<NotFoundPage>;
  let navigateByUrl: Mock;

  beforeEach(() => {
    navigateByUrl = vi.fn();

    TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
  });

  it('muestra el código 404 y el mensaje de página no encontrada', () => {
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('h1')?.textContent?.trim()).toBe('404');
    expect(host.textContent).toContain('Página no encontrada');
  });

  it('"Volver al inicio" navega a la raíz', () => {
    const boton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(boton.textContent?.trim()).toBe('Volver al inicio');

    boton.click();

    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
