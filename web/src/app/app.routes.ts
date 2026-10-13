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
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
