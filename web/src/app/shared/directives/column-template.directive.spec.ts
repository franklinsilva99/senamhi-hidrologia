import { Component, QueryList, TemplateRef, ViewChildren, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { ColumnTemplateDirective } from './column-template.directive';

@Component({
  imports: [ColumnTemplateDirective],
  template: `
    <ng-template columnTemplate="nombre">Celda de nombre</ng-template>
    <ng-template columnTemplate="acciones">Celda de acciones</ng-template>
    <ng-template [columnTemplate]="nombreDinamico">Celda dinámica</ng-template>
  `,
})
class HostComponent {
  nombreDinamico = 'estado';

  @ViewChildren(ColumnTemplateDirective)
  directivas!: QueryList<ColumnTemplateDirective>;
}

/** Renderiza el TemplateRef capturado y devuelve el texto resultante. */
function renderizar(template: TemplateRef<unknown>): string {
  const vista = template.createEmbeddedView({});
  vista.detectChanges();
  const texto = vista.rootNodes.map((nodo: Node) => nodo.textContent ?? '').join('');
  vista.destroy();
  return texto.trim();
}

describe('ColumnTemplateDirective', () => {
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

  it('crea una instancia por cada ng-template marcado con el atributo', () => {
    expect(host.directivas).toHaveLength(3);
  });

  it('captura el nombre asignado de forma estática', () => {
    const nombres = host.directivas.map((d) => d.name);
    expect(nombres).toContain('nombre');
    expect(nombres).toContain('acciones');
  });

  it('acepta el nombre por binding dinámico y lo actualiza al cambiar', async () => {
    expect(host.directivas.map((d) => d.name)).toContain('estado');

    host.nombreDinamico = 'fecha';
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    expect(host.directivas.map((d) => d.name)).toContain('fecha');
    expect(host.directivas.map((d) => d.name)).not.toContain('estado');
  });

  it('expone el TemplateRef del ng-template al que está aplicado', () => {
    for (const directiva of host.directivas) {
      expect(directiva.template).toBeInstanceOf(TemplateRef);
    }
  });

  it('cada instancia referencia su propio template y renderiza su contenido', () => {
    const porNombre = (nombre: string) =>
      host.directivas.find((d) => d.name === nombre)!;

    expect(renderizar(porNombre('nombre').template)).toBe('Celda de nombre');
    expect(renderizar(porNombre('acciones').template)).toBe('Celda de acciones');
    expect(porNombre('nombre').template).not.toBe(porNombre('acciones').template);
  });
});
