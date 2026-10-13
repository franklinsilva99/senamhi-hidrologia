// noinspection JSUnusedGlobalSymbols

import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { firstValueFrom } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { Constants } from '../models/constants';
import { ApiError } from '../errors/api.error';
import { format } from 'date-fns';

export interface DialogOptions {
  header: string;
  width?: string;
  modal?: boolean;
  draggable?: boolean;
  breakpoints?: Record<string, string>;
  closable?: boolean;
  focusOnShow?: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ToolService {
  private readonly _loadingCount = signal(0);
  readonly isLoading = computed(() => this._loadingCount() > 0);

  /** Mensaje contextual que muestra el overlay de progreso global. */
  readonly loadingMessage = signal<string>('Procesando…');

  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);

  async execute(
    action: () => Promise<void>,
    actionOnError?: () => void,
    message?: string,
  ): Promise<void> {
    try {
      if (message) {
        this.loadingMessage.set(message);
      }
      this._loadingCount.update((c) => c + 1);
      await action();
    } catch (e) {
      this.handleError(e, actionOnError);
    } finally {
      this._loadingCount.update((c) => Math.max(0, c - 1));
      if (this._loadingCount() === 0) {
        this.loadingMessage.set('Procesando…');
      }
    }
  }

  async executeWithFormValidator(
    formGroup: FormGroup,
    action: () => Promise<void>,
    actionOnError?: () => void,
  ): Promise<void> {
    if (formGroup.invalid) {
      formGroup.markAllAsDirty();
      formGroup.markAllAsTouched();
      formGroup.updateValueAndValidity();
      this.messageService.add({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: 'Verifique los campos ingresados.',
      });
      return;
    }

    try {
      this._loadingCount.update((c) => c + 1);
      await action();
    } catch (e) {
      this.handleError(e, actionOnError);
    } finally {
      this._loadingCount.update((c) => Math.max(0, c - 1));
    }
  }

  showSuccessMessage(detail?: string) {
    this.messageService.add({
      severity: 'success',
      summary: Constants.SUCCESS_TITLE,
      detail: detail ?? Constants.SUCCESS_MESSAGE,
    });
  }

  showWarningMessage(detail: string) {
    this.messageService.add({
      severity: 'warn',
      summary: Constants.WARNING_TITLE,
      detail,
    });
  }

  async openFormAndWait<T>(
    component: any,
    header: string,
    options: Partial<DialogOptions> = {},
  ): Promise<T | undefined> {
    const ref = this.openForm<T>(component, header, options);
    return firstValueFrom(ref.onClose);
  }

  openForm<T>(
    component: any,
    header: string,
    options: Partial<DialogOptions> = {},
  ): DynamicDialogRef {
    const defaultOptions: DialogOptions = {
      header,
      width: '30vw',
      modal: true,
      draggable: false,
      breakpoints: {
        '1400px': '35vw',
        '1200px': '40vw',
        '960px': '50vw',
        '640px': '80vw',
        '480px': '95vw',
      },
      closable: true,
      focusOnShow: false,
      data: options.data || {},
      ...options,
    };

    return <DynamicDialogRef>this.dialogService.open<T>(component, defaultOptions);
  }

  unwrapSettled<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  private handleError(e: unknown, actionOnError?: () => void) {
    // Trazabilidad completa para el desarrollador; al usuario solo le llega el mensaje legible.
    console.error('Error capturado:', e);

    const rawMessage = e instanceof Error ? e.message : '';

    if (rawMessage.includes('pe.gob.senamhi.exception.unauthorized')) {
      this.messageService.add({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: ApiError.ERROR_MESSAGE_401,
      });
      actionOnError?.();
      return;
    }

    if (rawMessage.includes('pe.gob.senamhi.exception.token.expired')) {
      this.messageService.add({
        severity: 'warn',
        summary: Constants.WARNING_TITLE,
        detail: ApiError.ERROR_MESSAGE_TOKEN_EXPIRED,
      });
      actionOnError?.();
      return;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'No se pudo completar la operación',
      detail: this.buildErrorDetail(e),
      life: 7000,
    });
    actionOnError?.();
  }

  /** Resuelve el detalle legible del toast según el tipo de error capturado. */
  private buildErrorDetail(e: unknown): string {
    if (e instanceof ApiError) {
      // ApiService ya extrajo el message del ResponseModel del backend (o un fallback conocido).
      return this.cleanErrorMessage(e.message);
    }

    if (e instanceof HttpErrorResponse) {
      // Error HTTP que no pasó por ApiService: intentar el message del ResponseModel.
      const backendMessage = e.error?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return this.cleanErrorMessage(backendMessage);
      }
      return this.fallbackMessageByStatus(e.status);
    }

    // Errores de programación u otros: no exponer detalles internos al usuario.
    return Constants.ERROR_MESSAGE;
  }

  /** Mensaje genérico según el código HTTP cuando el backend no envía un message útil. */
  private fallbackMessageByStatus(status: number): string {
    switch (status) {
      case 0:
        return ApiError.ERROR_MESSAGE_NOT_INTERNET;
      case 400:
      case 422:
        return 'Los datos enviados no son válidos. Revise la información e intente nuevamente.';
      case 401:
        return ApiError.ERROR_MESSAGE_401;
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return ApiError.ERROR_MESSAGE_404;
      case 500:
        return 'Ocurrió un error en el servidor. Intente nuevamente más tarde.';
      default:
        return ApiError.ERROR_MESSAGE_UNEXPECTED;
    }
  }

  /**
   * Convierte el mensaje crudo del backend en uno legible:
   * quita prefijos técnicos ("Error interno en el servidor:", códigos HV000030,
   * nombres de excepción Java), limpia los nombres de campo de las validaciones
   * ("nomenclature: La nomenclatura es obligatoria" → "La nomenclatura es obligatoria")
   * y corta los mensajes demasiado largos con elipsis.
   */
  private cleanErrorMessage(raw: string): string {
    let message = (raw ?? '').trim();

    const technicalPrefixes = [
      /^error interno en el servidor\s*:\s*/i,
      /^internal server error\s*:\s*/i,
      /^HV\d{6}\s*:\s*/,
      // Nombres de clase Java calificados: pe.gob.senamhi.exception.FooException:
      /^(?:[A-Za-z_$][\w$]*\.)+[A-Za-z_$][\w$]*(?:Exception|Error)\s*:\s*/,
    ];

    let stripped = true;
    while (stripped) {
      stripped = false;
      for (const prefix of technicalPrefixes) {
        if (prefix.test(message)) {
          message = message.replace(prefix, '').trim();
          stripped = true;
        }
      }
    }

    // Validaciones tipo "campo: mensaje; otroCampo: mensaje": quitar el nombre técnico del campo.
    message = message
      .split('; ')
      .map((segment) => segment.replace(/^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*\s*:\s*/, '').trim())
      .filter((segment, index, all) => segment && all.indexOf(segment) === index)
      .join('; ');

    if (!message) {
      return Constants.ERROR_MESSAGE;
    }

    const maxLength = 220;
    if (message.length > maxLength) {
      message = `${message.slice(0, maxLength - 1).trimEnd()}…`;
    }

    return message;
  }

  convertDatesToUTC(payload: unknown): unknown {
    if (payload instanceof Date) {
      return format(payload, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.convertDatesToUTC(item));
    }

    if (payload && typeof payload === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        result[key] = this.convertDatesToUTC(value);
      }
      return result;
    }

    return payload;
  }
}
