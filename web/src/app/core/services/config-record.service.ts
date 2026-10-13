import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { ConfigRecord } from '../models/config-record.model';
import { Variable } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class ConfigRecordService {
  private readonly api = inject(ApiService);

  /** Registro de configuración vigente para una (estación, variable) en una fecha. */
  vigente(stationId: string, variable: Variable, fecha: string): Observable<ConfigRecord> {
    return this.api.get<ConfigRecord>('config-records/vigente', { stationId, variable, fecha });
  }
}
