import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[columnTemplate]',
  standalone: true,
})
export class ColumnTemplateDirective {
  @Input('columnTemplate') name!: string;

  constructor(public template: TemplateRef<any>) {}
}
