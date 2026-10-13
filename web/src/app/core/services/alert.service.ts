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
}
