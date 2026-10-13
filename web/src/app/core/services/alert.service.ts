import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { Alert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly api = inject(ApiService);

  listar(): Observable<Alert[]> {
    return this.api.getAll<Alert>('alerts');
  }

  porCa(ca: string): Observable<Alert> {
    return this.api.get<Alert>(`alerts/${ca}`);
  }

  /** Ejecuta la detección y aplica crear/reemplazar/mantener. */
  runDetection(): Observable<string[]> {
    return this.api.post<string[]>('alerts/run-detection', {});
  }

  /** Habilita/deshabilita y/o valida DZ un aviso. */
  patch(ca: string, body: { vigente?: boolean; validadoDZ?: boolean }): Observable<Alert> {
    return this.api.put<Alert>(`alerts/${ca}`, body);
  }
}
