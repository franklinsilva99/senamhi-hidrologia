import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DividerModule } from 'primeng/divider';
import { ApiError } from '../../errors/api.error';

@Component({
  selector: 'app-error-dialog',
  imports: [ButtonModule, FieldsetModule, DividerModule],
  templateUrl: './error-dialog.html',
})
export class ErrorDialog implements OnInit {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly dynamicDialogConfig = inject(DynamicDialogConfig);

  message?: string;
  code?: string;
  trace?: string;

  ngOnInit(): void {
    const data = this.dynamicDialogConfig.data as {
      message?: string;
      trace?: string;
    };
    if (data) {
      // Sin message (o vacío) no hay código que separar: cae al mensaje genérico.
      const message = data.message ?? '';
      if (message.includes(':')) {
        const messageComposition = message.split(':');
        this.code = messageComposition[0];
        this.message = messageComposition.slice(1).join(':').trim();
      } else {
        this.message = this.getMessage(message);
      }
      this.trace = data.trace?.trim();
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getMessage(message: string): string {
    const errorCodes = {
      'pe.gob.senamhi.exception.database':
        'Se ha encontrado un error al interactuar con la base de datos.',
      'pe.gob.senamhi.exception.adapter': 'La respuesta de la API no tiene el formato esperado',
    };

    // @ts-ignore
    return errorCodes[message] ?? ApiError.ERROR_MESSAGE_UNEXPECTED;
  }
}
