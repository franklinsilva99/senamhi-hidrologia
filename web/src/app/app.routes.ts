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
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
