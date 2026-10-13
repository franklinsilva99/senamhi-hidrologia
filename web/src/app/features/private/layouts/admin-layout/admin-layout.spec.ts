import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeService } from '../../../../core/services/theme.service';
import { AdminLayout } from './admin-layout';

interface RutaFalsa {
  firstChild: RutaFalsa | null;
  snapshot: { data: Record<string, string> };
}

const ANCHO_ORIGINAL = window.innerWidth;

function fijarAncho(px: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: px });
}

describe('AdminLayout', () => {
  let componente: AdminLayout;
  let eventosRouter: Subject<unknown>;
  let hoja: RutaFalsa;

  function crear(url = '/monitoreo/pruebas-qc'): void {
    eventosRouter = new Subject<unknown>();
    hoja = {
      firstChild: null,
      snapshot: { data: { title: 'Pruebas QC', subtitle: 'Catálogo de pruebas' } },
    };
    const raiz: RutaFalsa = {
      firstChild: { firstChild: hoja, snapshot: { data: {} } },
      snapshot: { data: {} },
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: { url, events: eventosRouter.asObservable() } },
        { provide: ActivatedRoute, useValue: raiz as unknown as ActivatedRoute },
        { provide: ThemeService, useValue: { darkMode: signal(false), toggleDarkMode: vi.fn() } },
      ],
    });
    componente = TestBed.runInInjectionContext(() => new AdminLayout());
  }

  beforeEach(() => {
    fijarAncho(1280);
    crear();
  });

  afterEach(() => {
    fijarAncho(ANCHO_ORIGINAL);
  });

  describe('título de la página (data de la ruta)', () => {
    it('lee título y subtítulo de la hoja activa del árbol de rutas', () => {
      componente.ngOnInit();

      expect(componente.currentTitle()).toBe('Pruebas QC');
      expect(componente.currentSubtitle()).toBe('Catálogo de pruebas');
    });

    it('queda vacío cuando la ruta no declara data', () => {
      hoja.snapshot.data = {};
      componente.ngOnInit();

      expect(componente.currentTitle()).toBe('');
      expect(componente.currentSubtitle()).toBe('');
    });

    it('se actualiza en cada NavigationEnd', () => {
      componente.ngOnInit();

      hoja.snapshot.data = { title: 'Reprocesamiento', subtitle: 'Cargas históricas' };
      eventosRouter.next(
        new NavigationEnd(2, '/monitoreo/reprocesamiento', '/monitoreo/reprocesamiento'),
      );

      expect(componente.currentTitle()).toBe('Reprocesamiento');
      expect(componente.currentSubtitle()).toBe('Cargas históricas');
    });

    it('ignora los eventos de navegación que no son NavigationEnd', () => {
      componente.ngOnInit();

      hoja.snapshot.data = { title: 'Otra' };
      eventosRouter.next(new NavigationStart(2, '/monitoreo/reprocesamiento'));

      expect(componente.currentTitle()).toBe('Pruebas QC');
    });
  });

  describe('menú lateral', () => {
    it('expande solo el grupo cuyo submenú contiene la URL actual', () => {
      componente.ngOnInit();

      const porGrupo = Object.fromEntries(componente.menuItems.map((i) => [i.label, i.expanded]));
      expect(porGrupo['Catálogos']).toBe(true);
      expect(porGrupo['Configuración']).toBe(false);
      expect(porGrupo['Procesamiento']).toBe(false);
      expect(porGrupo['Revisión']).toBe(false);
    });

    it('un ítem sin url no expande su grupo', () => {
      const grupo = componente.menuItems.find((i) => i.label === 'Revisión')!;
      grupo.items = [{ label: 'Sin destino', icon: 'pi pi-ban' }];

      componente.ngOnInit();

      expect(grupo.expanded).toBe(false);
    });

    it('todos los grupos son estáticos y sus ítems apuntan a /monitoreo', () => {
      for (const grupo of componente.menuItems) {
        expect(grupo.static).toBe(true);
        for (const item of grupo.items ?? []) {
          expect(item.url).toMatch(/^\/monitoreo\//);
        }
      }
    });

    it('toggleSubmenu abre en acordeón: expandir uno colapsa el resto', () => {
      const [primero, segundo] = componente.menuItems;

      componente.toggleSubmenu(primero);
      expect(primero.expanded).toBe(true);

      componente.toggleSubmenu(segundo);
      expect(segundo.expanded).toBe(true);
      expect(primero.expanded).toBe(false);

      componente.toggleSubmenu(segundo);
      expect(segundo.expanded).toBe(false);
    });
  });

  describe('sidebar y modo móvil', () => {
    it('en escritorio alterna el colapso sin tocar la visibilidad móvil', () => {
      componente.ngOnInit();

      componente.toggleSidebar();
      expect(componente.sidebarCollapsed).toBe(true);
      expect(componente.sidebarShow).toBe(false);

      componente.toggleSidebar();
      expect(componente.sidebarCollapsed).toBe(false);
    });

    it('en móvil alterna la visibilidad del panel', () => {
      componente.ngOnInit();
      fijarAncho(500);
      componente.onResize();
      expect(componente.isMobile).toBe(true);

      componente.toggleSidebar();
      expect(componente.sidebarShow).toBe(true);
      expect(componente.sidebarCollapsed).toBe(false);

      componente.closeSidebar();
      expect(componente.sidebarShow).toBe(false);
    });

    it('cruzar el umbral de 768 px resetea colapso y visibilidad', () => {
      componente.ngOnInit();
      componente.sidebarCollapsed = true;

      fijarAncho(600);
      componente.onResize();

      expect(componente.isMobile).toBe(true);
      expect(componente.sidebarCollapsed).toBe(false);
      expect(componente.sidebarShow).toBe(false);
    });

    it('un resize dentro del mismo modo conserva el estado del usuario', () => {
      componente.ngOnInit();
      componente.sidebarCollapsed = true;

      fijarAncho(1024);
      componente.onResize();

      expect(componente.isMobile).toBe(false);
      expect(componente.sidebarCollapsed).toBe(true);
    });

    it('elegir una opción del menú cierra el panel solo en móvil', () => {
      componente.ngOnInit();
      componente.sidebarShow = true;

      componente.onMenuClick();
      expect(componente.sidebarShow).toBe(true);

      fijarAncho(500);
      componente.onResize();
      componente.sidebarShow = true;
      componente.onMenuClick();
      expect(componente.sidebarShow).toBe(false);
    });
  });

  describe('datos institucionales del pie', () => {
    it('expone nombre del sistema, autor y año en curso', () => {
      expect(componente.systemName).toBe('Sistema de Monitoreo Hidrológico');
      expect(componente.systemAuthor).toBe(
        'Oficina de Tecnologías de Información y la Comunicación',
      );
      expect(componente.year).toBe(new Date().getFullYear());
    });
  });
});
