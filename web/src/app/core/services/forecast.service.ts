import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { ForecastDiario, ForecastInput } from '../models/forecast.model';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  private readonly api = inject(ApiService);

  diario(stationId?: string): Observable<ForecastDiario[]> {
    return this.api.get<ForecastDiario[]>('forecast/diario', stationId ? { stationId } : undefined);
  }

  inputs(stationId?: string): Observable<ForecastInput[]> {
    return this.api.get<ForecastInput[]>('forecast/inputs', stationId ? { stationId } : undefined);
  }
}
