import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { USUARIO } from '../../../../core/models/usuario';

interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly usuario = USUARIO;

  readonly navItems: AdminNavItem[] = [
    { href: '/admin', label: 'Página Principal', icon: 'pi pi-home', exact: true },
    { href: '/admin/config', label: 'Configuración General', icon: 'pi pi-cog' },
    { href: '/admin/centros-poblados', label: 'Centros Poblados', icon: 'pi pi-map-marker' },
    { href: '/admin/avisos', label: 'Avisos', icon: 'pi pi-list' },
    { href: '/monitoreo', label: 'Monitoreo', icon: 'pi pi-chart-line' },
    { href: '/admin/pronostico', label: 'Pronóstico', icon: 'pi pi-chart-bar' },
  ];
}
