import { Component, Input, OnInit } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-page-title',
  imports: [CardModule, BreadcrumbModule],
  templateUrl: './page-title.html',
  styleUrl: './page-title.scss',
})
export class PageTitle implements OnInit {
  @Input() public title?: string;
  @Input() public subtitle?: string;
  @Input() public items: MenuItem[] = [];
  @Input() public hiddenBreadcrumb = false;

  home: MenuItem = { icon: 'pi pi-home', routerLink: '/admin' };

  ngOnInit(): void {
    this.items.push({ label: this.title || '' });
  }
}
