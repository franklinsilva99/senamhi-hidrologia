import { Routes } from '@angular/router';
import { AdminLayout } from './features/private/layouts/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/private/pages/home-page/home-page').then((m) => m.HomePage),
        data: { title: 'Resumen', subtitle: 'Estado general del monitoreo hidrológico' },
      },
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./features/private/pages/monitoreo-page/monitoreo-page').then(
            (m) => m.MonitoreoPage,
          ),
        data: { title: 'Monitoreo', subtitle: 'Mapa de estaciones y estado por umbral' },
      },
      {
        path: 'pronostico',
        loadComponent: () =>
          import('./features/private/pages/pronostico-page/pronostico-page').then(
            (m) => m.PronosticoPage,
          ),
        data: { title: 'Pronóstico', subtitle: 'Pronóstico hidrológico diario' },
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./features/private/pages/avisos-page/avisos-page').then((m) => m.AvisosPage),
        data: { title: 'Avisos', subtitle: 'Avisos hidrológicos' },
      },
      {
        path: 'avisos/:ca',
        loadComponent: () =>
          import('./features/private/pages/aviso-detalle-page/aviso-detalle-page').then(
            (m) => m.AvisoDetallePage,
          ),
        data: { title: 'Detalle de Aviso', subtitle: 'Aviso hidrológico' },
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/private/pages/admin-dashboard-page/admin-dashboard-page').then(
            (m) => m.AdminDashboardPage,
          ),
        data: { title: 'Administración', subtitle: 'Panel de administración' },
      },
      {
        path: 'admin/avisos',
        loadComponent: () =>
          import('./features/private/pages/admin-avisos-page/admin-avisos-page').then(
            (m) => m.AdminAvisosPage,
          ),
        data: { title: 'Gestionar Avisos', subtitle: 'Detección y publicación de avisos' },
      },
      {
        path: 'admin/config',
        loadComponent: () =>
          import('./features/private/pages/admin-config-page/admin-config-page').then(
            (m) => m.AdminConfigPage,
          ),
        data: { title: 'Configuración General', subtitle: 'Umbrales y vigencia' },
      },
      {
        path: 'admin/pronostico',
        loadComponent: () =>
          import('./features/private/pages/admin-pronostico-page/admin-pronostico-page').then(
            (m) => m.AdminPronosticoPage,
          ),
        data: { title: 'Cargar Pronóstico', subtitle: 'Registro de modelos' },
      },
      {
        path: 'admin/centros-poblados',
        loadComponent: () =>
          import(
            './features/private/pages/admin-centros-poblados-page/admin-centros-poblados-page'
          ).then((m) => m.AdminCentrosPobladosPage),
        data: { title: 'Centros Poblados', subtitle: 'Catálogo de centros poblados' },
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
