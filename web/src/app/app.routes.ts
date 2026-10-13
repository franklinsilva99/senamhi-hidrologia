import { Routes } from '@angular/router';
import { PublicLayout } from './features/public/layouts/public-layout/public-layout';
import { AdminLayout } from './features/private/layouts/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        redirectTo: 'monitoreo',
        pathMatch: 'full',
      },
      {
        path: 'monitoreo',
        loadComponent: () =>
          import('./features/private/pages/monitoreo-page/monitoreo-page').then(
            (m) => m.MonitoreoPage,
          ),
      },
      {
        path: 'pronostico',
        loadComponent: () =>
          import('./features/private/pages/pronostico-page/pronostico-page').then(
            (m) => m.PronosticoPage,
          ),
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./features/private/pages/avisos-page/avisos-page').then((m) => m.AvisosPage),
      },
      {
        path: 'avisos/:ca',
        loadComponent: () =>
          import('./features/private/pages/aviso-detalle-page/aviso-detalle-page').then(
            (m) => m.AvisoDetallePage,
          ),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/private/pages/admin-dashboard-page/admin-dashboard-page').then(
            (m) => m.AdminDashboardPage,
          ),
      },
      {
        path: 'avisos',
        loadComponent: () =>
          import('./features/private/pages/admin-avisos-page/admin-avisos-page').then(
            (m) => m.AdminAvisosPage,
          ),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./features/private/pages/admin-config-page/admin-config-page').then(
            (m) => m.AdminConfigPage,
          ),
      },
      {
        path: 'pronostico',
        loadComponent: () =>
          import('./features/private/pages/admin-pronostico-page/admin-pronostico-page').then(
            (m) => m.AdminPronosticoPage,
          ),
      },
      {
        path: 'centros-poblados',
        loadComponent: () =>
          import(
            './features/private/pages/admin-centros-poblados-page/admin-centros-poblados-page'
          ).then((m) => m.AdminCentrosPobladosPage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
