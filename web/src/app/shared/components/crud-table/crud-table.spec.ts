import { Component, ViewChild, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService } from 'primeng/api';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { CrudTable, TableColumn } from './crud-table';
import { ColumnTemplateDirective } from '../../directives/column-template.directive';
import { CrudTableActionsDirective } from '../../directives/crud-table-actions.directive';

interface Fila {
  id: number;
  nombre: string;
  activo?: boolean;
  fecha?: Date;
  estado?: string;
}

@Component({
  imports: [CrudTable, ColumnTemplateDirective, CrudTableActionsDirective],
  template: `
    <app-crud-table
      [data]="data"
      [columns]="columns"
      [globalFilterFields]="globalFilterFields"
      [isEditable]="isEditable"
      [isDeletable]="isDeletable"
      [confirmDelete]="confirmDelete"
      [canDeleteFn]="canDeleteFn"
      [columnFilters]="columnFilters"
      [sortField]="sortField"
      [sortOrder]="sortOrder"
      (edit)="edits.push($event)"
      (delete)="deletes.push($event)"
    >
      <ng-template columnTemplate="estadoTpl" let-valor let-fila="row">
        <span class="celda-personalizada">{{ valor }}#{{ fila.id }}</span>
      </ng-template>
      @if (conAcciones) {
        <ng-template crudTableActions let-fila>
          <button class="accion-extra" type="button">Ver {{ fila.id }}</button>
        </ng-template>
      }
    </app-crud-table>
  `,
})
class HostComponent {
  data: Fila[] = [];
  columns: TableColumn[] = [];
  globalFilterFields: string[] = [];
  isEditable = true;
  isDeletable = true;
  confirmDelete = true;
  columnFilters = false;
  sortField = '';
  sortOrder = -1;
  conAcciones = false;
  canDeleteFn: (row: Fila) => boolean = () => true;
  edits: unknown[] = [];
  deletes: unknown[] = [];

  @ViewChild(CrudTable) tabla!: CrudTable;
}

describe('CrudTable (lógica de clase)', () => {
  let fixture: ComponentFixture<CrudTable>;
  let componente: CrudTable;
  let confirmationService: ConfirmationService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CrudTable],
      providers: [provideZonelessChangeDetection(), ConfirmationService],
    });
    fixture = TestBed.createComponent(CrudTable);
    componente = fixture.componentInstance;
    confirmationService = TestBed.inject(ConfirmationService);
    await fixture.whenStable();
  });

  describe('isColumnFilterable', () => {
    it('acepta columnas de texto (explícitas o sin tipo) y de tag', () => {
      expect(componente.isColumnFilterable({ field: 'a', header: 'A', type: 'text' })).toBe(true);
      expect(componente.isColumnFilterable({ field: 'b', header: 'B' })).toBe(true);
      expect(componente.isColumnFilterable({ field: 'c', header: 'C', type: 'tag' })).toBe(true);
    });

    it('excluye fechas, booleanos y columnas custom', () => {
      expect(componente.isColumnFilterable({ field: 'a', header: 'A', type: 'date' })).toBe(false);
      expect(componente.isColumnFilterable({ field: 'b', header: 'B', type: 'dateTime' })).toBe(
        false,
      );
      expect(componente.isColumnFilterable({ field: 'c', header: 'C', type: 'boolean' })).toBe(
        false,
      );
      expect(componente.isColumnFilterable({ field: 'd', header: 'D', type: 'custom' })).toBe(
        false,
      );
    });

    it('respeta filterable=false aunque la columna sea de texto', () => {
      expect(
        componente.isColumnFilterable({ field: 'a', header: 'A', type: 'text', filterable: false }),
      ).toBe(false);
    });
  });

  describe('hasColumnFilters', () => {
    it('es false si columnFilters está apagado aunque haya columnas filtrables', () => {
      componente.columnFilters = false;
      componente.columns = [{ field: 'nombre', header: 'Nombre', type: 'text' }];
      expect(componente.hasColumnFilters).toBe(false);
    });

    it('es false si está encendido pero ninguna columna es filtrable', () => {
      componente.columnFilters = true;
      componente.columns = [
        { field: 'fecha', header: 'Fecha', type: 'date' },
        { field: 'activo', header: 'Activo', type: 'boolean' },
      ];
      expect(componente.hasColumnFilters).toBe(false);
    });

    it('es true si está encendido y al menos una columna filtra', () => {
      componente.columnFilters = true;
      componente.columns = [
        { field: 'fecha', header: 'Fecha', type: 'date' },
        { field: 'nombre', header: 'Nombre', type: 'text' },
      ];
      expect(componente.hasColumnFilters).toBe(true);
    });
  });

  describe('hasActions', () => {
    it('es true por defecto (editable y eliminable)', () => {
      expect(componente.hasActions).toBe(true);
    });

    it('es false sin edición, sin borrado y sin template de acciones', () => {
      componente.isEditable = false;
      componente.isDeletable = false;
      expect(componente.actionsTemplate).toBeUndefined();
      expect(componente.hasActions).toBe(false);
    });

    it('basta con isDeletable para habilitar la columna de acciones', () => {
      componente.isEditable = false;
      componente.isDeletable = true;
      expect(componente.hasActions).toBe(true);
    });
  });

  it('onEdit emite el identificador recibido', () => {
    const emitidos: unknown[] = [];
    componente.edit.subscribe((id) => emitidos.push(id));

    componente.onEdit(42);

    expect(emitidos).toEqual([42]);
  });

  it('canDelete delega en canDeleteFn con la fila completa', () => {
    const fila = { id: 1, bloqueado: true };
    componente.canDeleteFn = vi.fn((row: { bloqueado: boolean }) => !row.bloqueado);

    expect(componente.canDelete(fila)).toBe(false);
    expect(componente.canDeleteFn).toHaveBeenCalledExactlyOnceWith(fila);
  });

  it('onDelete sin confirmación emite directo y no abre el diálogo', () => {
    const confirmar = vi.spyOn(confirmationService, 'confirm');
    const emitidos: unknown[] = [];
    componente.delete.subscribe((id) => emitidos.push(id));
    componente.confirmDelete = false;

    componente.onDelete(7);

    expect(emitidos).toEqual([7]);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('onDelete con confirmación solo emite cuando el usuario acepta', async () => {
    let opciones: Confirmation | undefined;
    vi.spyOn(confirmationService, 'confirm').mockImplementation((conf: Confirmation) => {
      opciones = conf;
      return confirmationService;
    });
    const emitidos: unknown[] = [];
    componente.delete.subscribe((id) => emitidos.push(id));

    componente.onDelete(9);

    // Todavía no se aceptó: no debe haberse emitido nada.
    expect(emitidos).toEqual([]);
    expect(opciones?.header).toBe('Eliminar registro');
    expect(opciones?.acceptLabel).toBe('Eliminar');
    expect(opciones?.rejectLabel).toBe('Cancelar');

    await opciones?.accept?.();

    expect(emitidos).toEqual([9]);
  });

  it('onSearch aplica el filtro global "contains" con el valor tipeado', () => {
    const tabla = { filterGlobal: vi.fn() };
    const input = document.createElement('input');
    input.value = 'lima';

    componente.onSearch({ target: input } as unknown as Event, tabla);

    expect(tabla.filterGlobal).toHaveBeenCalledExactlyOnceWith('lima', 'contains');
  });
});

describe('CrudTable (render)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const nativo = (): HTMLElement => fixture.nativeElement;
  const textos = (selector: string): string[] =>
    Array.from(nativo().querySelectorAll(selector)).map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection(), ConfirmationService],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.columns = [
      { field: 'nombre', header: 'Nombre', type: 'text' },
      { field: 'activo', header: 'Activo', type: 'boolean' },
      { field: 'fecha', header: 'Fecha', type: 'date' },
      { field: 'estado', header: 'Estado', type: 'custom', templateName: 'estadoTpl' },
    ];
    host.data = [
      { id: 1, nombre: 'Antisana', activo: true, fecha: new Date(2026, 0, 15), estado: 'OK' },
      { id: 2, nombre: 'Campo de Marte', activo: false, fecha: new Date(2026, 7, 3), estado: 'KO' },
    ];
    await fixture.whenStable();
  });

  const refrescar = async () => {
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
  };

  it('muestra el total de registros según data.length', () => {
    expect(nativo().querySelector('p-tag')?.textContent?.trim()).toBe('2');
  });

  it('renderiza los encabezados de columna más la columna Acciones', () => {
    expect(textos('th')).toEqual(['Nombre', 'Activo', 'Fecha', 'Estado', 'Acciones']);
  });

  it('renderiza texto, booleanos como Sí/No y fechas dd/MM/yyyy', () => {
    const filas = Array.from(nativo().querySelectorAll('tbody tr'));
    const celdas = (i: number) =>
      Array.from(filas[i].querySelectorAll('td')).map((td) =>
        (td.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );

    expect(celdas(0).slice(0, 3)).toEqual(['Antisana', 'Sí', '15/01/2026']);
    expect(celdas(1).slice(0, 3)).toEqual(['Campo de Marte', 'No', '03/08/2026']);
  });

  it('proyecta el template custom con el valor como $implicit y la fila como row', () => {
    expect(textos('.celda-personalizada')).toEqual(['OK#1', 'KO#2']);
  });

  it('ordena por sortField: descendente por defecto y ascendente con sortOrder = 1', async () => {
    const nombres = () => textos('tbody tr td:first-child');
    // Sin sortField se respeta el orden de llegada de los datos.
    expect(nombres()).toEqual(['Antisana', 'Campo de Marte']);

    host.sortField = 'nombre';
    await refrescar();
    expect(nombres()).toEqual(['Campo de Marte', 'Antisana']);

    host.sortOrder = 1;
    await refrescar();
    expect(nombres()).toEqual(['Antisana', 'Campo de Marte']);
  });

  it('oculta la columna de acciones cuando no hay edición ni borrado', async () => {
    host.isEditable = false;
    host.isDeletable = false;
    await refrescar();

    expect(textos('th')).toEqual(['Nombre', 'Activo', 'Fecha', 'Estado']);
    expect(nativo().querySelector('p-button')).toBeNull();
  });

  it('omite el botón de eliminar en filas donde canDeleteFn devuelve false', async () => {
    host.canDeleteFn = (row) => row.id !== 1;
    await refrescar();

    const filas = Array.from(nativo().querySelectorAll('tbody tr'));
    const botonesEliminar = (fila: Element) => fila.querySelectorAll('p-button .pi-trash').length;
    expect(botonesEliminar(filas[0])).toBe(0);
    expect(botonesEliminar(filas[1])).toBe(1);
  });

  it('proyecta el template de acciones adicional por fila', async () => {
    host.conAcciones = true;
    await refrescar();

    expect(textos('.accion-extra')).toEqual(['Ver 1', 'Ver 2']);
  });

  it('el buscador global solo aparece cuando hay globalFilterFields', async () => {
    // Sin campos de filtro global no se renderiza el caption con el buscador.
    expect(nativo().querySelector('input[placeholder="Buscar"]')).toBeNull();

    // El template de caption se registra en la inicialización de p-table,
    // por eso se arma una instancia nueva con los campos ya definidos.
    const fixtureConFiltro = TestBed.createComponent(HostComponent);
    fixtureConFiltro.componentInstance.columns = host.columns;
    fixtureConFiltro.componentInstance.data = host.data;
    fixtureConFiltro.componentInstance.globalFilterFields = ['nombre'];
    await fixtureConFiltro.whenStable();

    expect(
      fixtureConFiltro.nativeElement.querySelector('input[placeholder="Buscar"]'),
    ).not.toBeNull();
  });

  it('la fila de filtros por columna aparece solo para columnas filtrables', async () => {
    expect(nativo().querySelector('.filter-row')).toBeNull();

    host.columnFilters = true;
    await refrescar();

    const filaFiltros = nativo().querySelector('.filter-row');
    expect(filaFiltros).not.toBeNull();
    // Solo la columna de texto (Nombre) lleva filtro; boolean/date/custom no.
    expect(filaFiltros?.querySelectorAll('p-columnfilter').length).toBe(1);
  });

  it('el botón de editar emite el id de la fila', async () => {
    const botonEditar = nativo().querySelector('p-button .pi-pencil')?.closest('button');
    expect(botonEditar).not.toBeNull();

    botonEditar?.click();
    await fixture.whenStable();

    expect(host.edits).toEqual([1]);
  });

  it('registra los templates proyectados en templateMap', () => {
    expect(host.tabla.templateMap.has('estadoTpl')).toBe(true);
  });
});
