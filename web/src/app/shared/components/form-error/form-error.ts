import { Component, Input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  imports: [],
  templateUrl: './form-error.html',
  styleUrl: './form-error.scss',
})
export class FormError {
  @Input() control?: AbstractControl | null;
  @Input() customMessages: { [key: string]: string } = {};

  get errorMessage(): string | undefined {
    if (!this.control?.errors || !this.control?.touched) {
      return undefined;
    }

    const errors: ValidationErrors = this.control.errors;

    const firstErrorKey = Object.keys(errors)[0];
    if (!firstErrorKey) {
      return undefined;
    }

    if (this.customMessages[firstErrorKey]) {
      return this.customMessages[firstErrorKey];
    }

    switch (firstErrorKey) {
      case 'required':
        return 'Este campo es obligatorio.';
      case 'maxlength':
        return `No puede superar ${errors['maxlength'].requiredLength} caracteres.`;
      case 'minlength':
        return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
      case 'min':
        return `El valor mínimo es ${errors['min'].min}.`;
      case 'max':
        return `El valor máximo es ${errors['max'].max}.`;
      case 'email':
        return 'Correo electrónico inválido.';
      case 'pattern':
        return 'No cumple con el formato requerido.';
      case 'mismatch':
        return 'Los valores no coinciden.';
      default:
        return 'Campo inválido.';
    }
  }
}
