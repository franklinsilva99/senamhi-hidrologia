import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { ObservationView } from '../models/observation.model';

@Injectable({ providedIn: 'root' })
export class ObservationService {
  private readonly api = inject(ApiService);

  /** Serie fusionada (nivel + caudal) de una estación, opcionalmente recortada. */
  serieFusionada(stationId: number, hours?: number): Observable<ObservationView[]> {
    return this.api.get<ObservationView[]>(
      `stations/${stationId}/observations`,
      hours ? { hours } : undefined,
    );
  }

  /** Última lectura de todas las estaciones (para el mapa). */
  latest(): Observable<Record<string, ObservationView>> {
    return this.api.get<Record<string, ObservationView>>('observations/latest');
  }
}
