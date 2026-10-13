import { Component, ViewChild, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { ReportTable, TableColumn } from './report-table';
import { ColumnTemplateDirective } from '../../directives/column-template.directive';

interface Fila {
  id: number;
  nombre: string;
  estado?: string;
  valido?: boolean;
  fecha?: Date;
}

@Component({
  imports: [ReportTable, ColumnTemplateDirective],
  template: `
    <app-report-table [data]="data" [columns]="columns" [globalFilterFields]="globalFilterFields">
      <ng-template columnTemplate="resumenTpl" let-fila>
        <span class="celda-resumen">{{ fila.nombre }} ({{ fila.id }})</span>
      </ng-template>
    </app-report-table>
  `,
})
class HostComponent {
  data: Fila[] = [];
  columns: TableColumn[] = [];
  globalFilterFields: string[] = [];

  @ViewChild(ReportTable) tabla!: ReportTable;
}

describe('ReportTable', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const nativo = (): HTMLElement => fixture.nativeElement;
  const textos = (selector: string): string[] =>
    Array.from(nativo().querySelectorAll(selector)).map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

  const refrescar = async () => {
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.columns = [
      { field: 'nombre', header: 'Nombre', type: 'text' },
      { field: 'estado', header: 'Estado', type: 'tag', tagStyle: 'tag-ok' },
      { field: 'valido', header: 'Válido', type: 'boolean' },
      { field: 'fecha', header: 'Fecha', type: 'date' },
    ];
    host.data = [
      { id: 1, nombre: 'PM10', estado: 'APROBADO', valido: true, fecha: new Date(2026, 2, 9) },
      { id: 2, nombre: 'SO2', estado: 'OBSERVADO', valido: false, fecha: new Date(2026, 11, 31) },
    ];
    await fixture.whenStable();
  });

  it('renderiza un encabezado por columna, sin columna de acciones', () => {
    expect(textos('th')).toEqual(['Nombre', 'Estado', 'Válido', 'Fecha']);
  });

  it('renderiza celdas de texto con el valor del campo', () => {
    const primeraFila = nativo().querySelector('tbody tr');
    expect(primeraFila?.querySelector('td span')?.textContent?.trim()).toBe('PM10');
  });

  it('renderiza tags con el valor y la clase tagStyle de la columna', () => {
    const tags = Array.from(nativo().querySelectorAll('tbody p-tag.tag-ok'));
    expect(tags.map((t) => t.textContent?.trim())).toEqual(['APROBADO', 'OBSERVADO']);
  });

  it('traduce booleanos a Sí/No', () => {
    const filas = Array.from(nativo().querySelectorAll('tbody tr'));
    const celdaBooleana = (fila: Element) =>
      fila.querySelectorAll('td')[2]?.textContent?.trim() ?? '';
    expect(celdaBooleana(filas[0])).toBe('Sí');
    expect(celdaBooleana(filas[1])).toBe('No');
  });

  it('formatea fechas como dd/MM/yyyy dentro de un span, sin td anidado', () => {
    const filas = Array.from(nativo().querySelectorAll('tbody tr'));
    const celdaFecha = (fila: Element) => fila.querySelectorAll('td')[3];

    expect(celdaFecha(filas[0])?.textContent?.trim()).toBe('09/03/2026');
    expect(celdaFecha(filas[1])?.textContent?.trim()).toBe('31/12/2026');
    // Un <td> dentro de otro <td> es HTML inválido: la rama de fecha debe usar
    // <span>, igual que el resto de tipos.
    expect(celdaFecha(filas[0])?.querySelector('td')).toBeNull();
    expect(celdaFecha(filas[0])?.querySelector('span')?.textContent?.trim()).toBe('09/03/2026');
  });

  it('proyecta el template custom con la fila completa como $implicit', async () => {
    host.columns = [
      { field: 'nombre', header: 'Nombre', type: 'text' },
      { field: 'id', header: 'Resumen', type: 'custom', templateName: 'resumenTpl' },
    ];
    await refrescar();

    expect(textos('.celda-resumen')).toEqual(['PM10 (1)', 'SO2 (2)']);
  });

  it('una columna custom sin templateName deja la celda vacía', async () => {
    host.columns = [{ field: 'nombre', header: 'Nombre', type: 'custom' }];
    await refrescar();

    const celda = nativo().querySelector('tbody tr td');
    expect(celda?.textContent?.trim()).toBe('');
  });

  it('una columna sin tipo cae en la rama por defecto y muestra el valor', async () => {
    host.columns = [{ field: 'nombre', header: 'Nombre' }];
    await refrescar();

    expect(nativo().querySelector('tbody tr td span')?.textContent?.trim()).toBe('PM10');
  });

  it('registra los templates proyectados en templateMap', () => {
    expect(host.tabla.templateMap.get('resumenTpl')).toBeDefined();
    expect(host.tabla.templateMap.size).toBe(1);
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

  it('onSearch aplica el filtro global "contains" con el valor tipeado', () => {
    const tablaPrime = { filterGlobal: vi.fn() };
    const input = document.createElement('input');
    input.value = 'so2';

    host.tabla.onSearch({ target: input } as unknown as Event, tablaPrime);

    expect(tablaPrime.filterGlobal).toHaveBeenCalledExactlyOnceWith('so2', 'contains');
  });
});
