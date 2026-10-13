import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  inject,
  Input,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { ColumnTemplateDirective } from '../../directives/column-template.directive';
import { CrudTableActionsDirective } from '../../directives/crud-table-actions.directive';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  /** Permite excluir la columna de la fila de filtros (por defecto filtran las de texto/tag). */
  filterable?: boolean;
  width?: string;
  type?: 'text' | 'tag' | 'date' | 'dateTime' | 'dateTimeMedium' | 'boolean' | 'custom';
  tagStyle?: string;
  templateName?: string;
}

@Component({
  selector: 'app-crud-table',
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
  templateUrl: './crud-table.html',
  styleUrls: ['./crud-table.scss'],
})
export class CrudTable implements AfterContentInit {
  private readonly confirmationService = inject(ConfirmationService);

  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() globalFilterFields: string[] = [];
  @Input() rows = 10;
  @Input() rowsPerPageOptions = [10, 20, 50, 100, 200, 500];
  @Input() showGridlines = true;
  @Input() stripedRows = true;
  @Input() size: 'small' | 'large' = 'small';
  @Input() canDeleteFn: (row: any) => boolean = () => true;
  @Input() isEditable = true;
  @Input() isDeletable = true;
  @Input() confirmDelete: boolean = true;
  @Input() sortField = '';
  /** Orden inicial de sortField: -1 descendente (por defecto), 1 ascendente. */
  @Input() sortOrder = -1;
  /** Muestra la fila de filtros por columna (solo aplica a columnas de texto/tag). */
  @Input() columnFilters = false;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  @ContentChildren(ColumnTemplateDirective) columnTemplates!: QueryList<ColumnTemplateDirective>;
  @ContentChild(CrudTableActionsDirective) actionsTemplateDir?: CrudTableActionsDirective;

  templateMap = new Map<string, TemplateRef<any>>();

  get actionsTemplate() {
    return this.actionsTemplateDir?.template;
  }

  get hasActions(): boolean {
    return this.isEditable || this.isDeletable || !!this.actionsTemplate;
  }

  /** ¿La columna admite filtro de texto? Solo texto/tag; fechas, booleanos y custom quedan fuera. */
  isColumnFilterable(col: TableColumn): boolean {
    if (col.filterable === false) {
      return false;
    }
    const type = col.type ?? 'text';
    return type === 'text' || type === 'tag';
  }

  /** ¿Debe renderizarse la fila de filtros por columna? */
  get hasColumnFilters(): boolean {
    return this.columnFilters && this.columns.some((col) => this.isColumnFilterable(col));
  }

  ngAfterContentInit(): void {
    this.columnTemplates.forEach((ct) => {
      this.templateMap.set(ct.name, ct.template);
    });
  }

  onEdit(id: any): void {
    this.edit.emit(id);
  }

  canDelete(row: any): boolean {
    return this.canDeleteFn(row);
  }

  onDelete(id: any): void {
    if (this.confirmDelete) {
      this.confirmationService.confirm({
        message: '¿Está seguro de que desea eliminar este registro?',
        header: 'Eliminar registro',
        icon: 'pi pi-exclamation-triangle',
        defaultFocus: 'none',
        acceptLabel: 'Eliminar',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        accept: async () => {
          this.delete.emit(id);
        },
      });
    } else {
      this.delete.emit(id);
    }
  }

  onSearch(event: Event, table: any): void {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }
}
