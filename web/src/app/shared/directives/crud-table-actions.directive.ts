import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[crudTableActions]',
})
export class CrudTableActionsDirective {
  constructor(public template: TemplateRef<any>) {}
}
