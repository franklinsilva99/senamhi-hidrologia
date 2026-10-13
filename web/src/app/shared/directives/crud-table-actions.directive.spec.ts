import { Component, QueryList, TemplateRef, ViewChildren, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';

import { CrudTableActionsDirective } from './crud-table-actions.directive';

interface ContextoFila {
  $implicit: { nombre: string };
  indice: number;
}

@Component({
  imports: [CrudTableActionsDirective],
  template: `
    <ng-template crudTableActions let-fila let-indice="indice">{{ fila.nombre }} ({{ indice }})</ng-template>
    <ng-template crudTableActions>Acciones fijas</ng-template>
  `,
})
class HostComponent {
  @ViewChildren(CrudTableActionsDirective)
  directivas!: QueryList<CrudTableActionsDirective>;
}

describe('CrudTableActionsDirective', () => {
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
    expect(host.directivas).toHaveLength(2);
  });

  it('expone el TemplateRef del ng-template al que está aplicado', () => {
    for (const directiva of host.directivas) {
      expect(directiva.template).toBeInstanceOf(TemplateRef);
    }
  });

  it('el template capturado renderiza el contexto implícito y las variables nombradas', () => {
    const conContexto = host.directivas.first.template as TemplateRef<ContextoFila>;
    const vista = conContexto.createEmbeddedView({
      $implicit: { nombre: 'Estación A' },
      indice: 3,
    });
    vista.detectChanges();

    const texto = vista.rootNodes.map((nodo: Node) => nodo.textContent ?? '').join('').trim();
    expect(texto).toBe('Estación A (3)');
    vista.destroy();
  });

  it('el template refleja los cambios de contexto al re-renderizar', () => {
    const conContexto = host.directivas.first.template as TemplateRef<ContextoFila>;
    const vista = conContexto.createEmbeddedView({
      $implicit: { nombre: 'Estación A' },
      indice: 1,
    });
    vista.detectChanges();

    vista.context.$implicit = { nombre: 'Estación B' };
    vista.context.indice = 2;
    vista.detectChanges();

    const texto = vista.rootNodes.map((nodo: Node) => nodo.textContent ?? '').join('').trim();
    expect(texto).toBe('Estación B (2)');
    vista.destroy();
  });

  it('cada instancia referencia su propio template', () => {
    const [primera, segunda] = host.directivas.toArray();
    expect(primera.template).not.toBe(segunda.template);

    const vista = (segunda.template as TemplateRef<unknown>).createEmbeddedView({});
    vista.detectChanges();
    const texto = vista.rootNodes.map((nodo: Node) => nodo.textContent ?? '').join('').trim();
    expect(texto).toBe('Acciones fijas');
    vista.destroy();
  });
});
