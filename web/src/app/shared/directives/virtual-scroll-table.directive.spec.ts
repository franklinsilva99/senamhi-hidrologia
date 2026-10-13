import { Component, ViewChild, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { VirtualScrollTableDirective } from './virtual-scroll-table.directive';

/**
 * Doble del CdkVirtualScrollViewport: permite simular el scroll emitiendo
 * en scrolledIndexChange y verificar las delegaciones de la directiva.
 */
class ViewportMock {
  scrolledIndexChange = new Subject<number>();
  scrollToIndex = vi.fn();
  getDataLength = vi.fn().mockReturnValue(0);
  checkViewportSize = vi.fn();
}

@Component({
  imports: [VirtualScrollTableDirective],
  template: `<div appVirtualScrollTable></div>`,
})
class HostComponent {
  @ViewChild(VirtualScrollTableDirective)
  directiva!: VirtualScrollTableDirective;
}

describe('VirtualScrollTableDirective', () => {
  let viewport: ViewportMock;
  let fixture: ComponentFixture<HostComponent>;
  let directiva: VirtualScrollTableDirective;

  beforeEach(async () => {
    viewport = new ViewportMock();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CdkVirtualScrollViewport, useValue: viewport },
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    directiva = fixture.componentInstance.directiva;
  });

  it('no deja suscripciones abiertas sobre scrolledIndexChange al inicializarse', () => {
    // Antes se suscribía con un handler vacío que nunca se liberaba (fuga).
    expect(viewport.scrolledIndexChange.observed).toBe(false);
  });

  it('las emisiones de scroll del viewport no disparan acciones sobre él', () => {
    // Simula el scroll del usuario: cambia el primer índice visible varias veces.
    viewport.scrolledIndexChange.next(0);
    viewport.scrolledIndexChange.next(12);
    viewport.scrolledIndexChange.next(3);

    expect(viewport.scrollToIndex).not.toHaveBeenCalled();
    expect(viewport.checkViewportSize).not.toHaveBeenCalled();
  });

  it('scrollToIndex delega en el viewport con desplazamiento suave', () => {
    directiva.scrollToIndex(42);
    expect(viewport.scrollToIndex).toHaveBeenCalledExactlyOnceWith(42, 'smooth');
  });

  it('scrollToStart desplaza al índice 0 con desplazamiento suave', () => {
    directiva.scrollToStart();
    expect(viewport.scrollToIndex).toHaveBeenCalledExactlyOnceWith(0, 'smooth');
  });

  it('scrollToEnd desplaza al último índice según el largo de la data', () => {
    viewport.getDataLength.mockReturnValue(500);
    directiva.scrollToEnd();
    expect(viewport.scrollToIndex).toHaveBeenCalledExactlyOnceWith(499, 'smooth');
  });

  it('scrollToEnd con un solo elemento desplaza al índice 0', () => {
    viewport.getDataLength.mockReturnValue(1);
    directiva.scrollToEnd();
    expect(viewport.scrollToIndex).toHaveBeenCalledExactlyOnceWith(0, 'smooth');
  });

  it('scrollToEnd con data vacía no pide ningún desplazamiento', () => {
    // Antes llamaba scrollToIndex(-1); ahora se resguarda contra getDataLength() === 0.
    viewport.getDataLength.mockReturnValue(0);
    directiva.scrollToEnd();
    expect(viewport.scrollToIndex).not.toHaveBeenCalled();
  });

  it('refresh reevalúa el tamaño del viewport', () => {
    directiva.refresh();
    expect(viewport.checkViewportSize).toHaveBeenCalledOnce();
    expect(viewport.scrollToIndex).not.toHaveBeenCalled();
  });

  it('al destruirse el host no queda ninguna suscripción viva sobre el viewport', () => {
    fixture.destroy();
    expect(viewport.scrolledIndexChange.observed).toBe(false);
  });
});
