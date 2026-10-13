import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { Register } from '../../../../../register';
import { ImageModule } from 'primeng/image';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../../core/services/theme.service';
import { ServerStatusService } from '../../../../core/services/server-status.service';
import { ProgressOverlay } from '../../../../shared/components/progress-overlay/progress-overlay';

export interface AdminMenuItem extends MenuItem {
  items?: MenuItem[];
  expanded?: boolean;
  /** Grupo estático: sus ítems se muestran siempre, sin dropdown ni click. */
  static?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ImageModule,
    SelectModule,
    ButtonModule,
    ProgressOverlay,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);
  readonly serverStatus = inject(ServerStatusService);

  sidebarCollapsed = false;
  sidebarShow = false;
  isMobile = false;

  /** Título y subtítulo de la página actual, leídos de la `data` de la ruta. */
  readonly currentTitle = signal('');
  readonly currentSubtitle = signal('');

  menuItems: AdminMenuItem[] = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      url: '/',
    },
    {
      label: 'Monitoreo',
      icon: 'pi pi-map-marker',
      url: '/monitoreo',
    },
  ];

  get systemName(): string {
    return Register.SYSTEM_NAME;
  }

  get systemAuthor(): string {
    return Register.SYSTEM_AUTHOR;
  }

  get year(): number {
    return new Date().getFullYear();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.checkActiveRoutes();
    this.refreshPageTitle();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refreshPageTitle());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.sidebarShow = !this.sidebarShow;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  closeSidebar(): void {
    this.sidebarShow = false;
  }

  toggleSubmenu(item: AdminMenuItem): void {
    if (item.expanded) {
      item.expanded = false;
    } else {
      this.menuItems.forEach((menuItem) => {
        if (menuItem.items) {
          menuItem.expanded = false;
        }
      });
      item.expanded = true;
    }
  }

  onMenuClick(): void {
    if (this.isMobile) {
      this.sidebarShow = false;
    }
  }

  private checkScreenSize(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    if (wasMobile !== this.isMobile) {
      this.sidebarCollapsed = false;
      this.sidebarShow = false;
    }
  }

  private checkActiveRoutes(): void {
    const currentUrl: string = this.router.url;
    this.menuItems.forEach((item) => {
      const subMenu: MenuItem[] = item.items ?? [];
      item.expanded = subMenu.some((x) => !!x.url && currentUrl.startsWith(x.url));
    });
  }

  /** Lee `data.title`/`data.subtitle` de la hoja activa del árbol de rutas. */
  private refreshPageTitle(): void {
    let r = this.activatedRoute;
    while (r.firstChild) {
      r = r.firstChild;
    }
    const data = r.snapshot.data;
    this.currentTitle.set((data['title'] as string) ?? '');
    this.currentSubtitle.set((data['subtitle'] as string) ?? '');
  }

  /** Vuelve a cargar la pantalla actual con datos completos. */
  reload(): void {
    this.serverStatus.ok();
    globalThis.location.reload();
  }
}
