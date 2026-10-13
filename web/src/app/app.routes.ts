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
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
