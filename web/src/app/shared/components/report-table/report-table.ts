import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  Input,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ColumnTemplateDirective } from '../../directives/column-template.directive';
import { CrudTableActionsDirective } from '../../directives/crud-table-actions.directive';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'tag' | 'date' | 'boolean' | 'custom';
  tagStyle?: string;
  templateName?: string;
}

@Component({
  selector: 'app-report-table',
  imports: [
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    NgTemplateOutlet,
    NgClass,
    DatePipe,
  ],
  templateUrl: './report-table.html',
  styleUrls: ['./report-table.scss'],
})
export class ReportTable implements AfterContentInit {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() globalFilterFields: string[] = [];
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [10, 20, 50, 100];
  @Input() showGridlines = true;
  @Input() stripedRows = true;
  @Input() size: 'small' | 'large' = 'small';

  @ContentChildren(ColumnTemplateDirective) columnTemplates!: QueryList<ColumnTemplateDirective>;
  @ContentChild(CrudTableActionsDirective) actionsTemplateDir?: CrudTableActionsDirective;

  templateMap = new Map<string, TemplateRef<any>>();

  ngAfterContentInit(): void {
    this.columnTemplates.forEach((ct) => {
      this.templateMap.set(ct.name, ct.template);
    });
  }

  onSearch(event: Event, table: any): void {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }
}
