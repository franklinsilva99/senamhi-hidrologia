import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { Station } from '../models/station.model';

@Injectable({ providedIn: 'root' })
export class StationService {
  private readonly api = inject(ApiService);

  listar(): Observable<Station[]> {
    return this.api.getAll<Station>('stations');
  }

  porId(id: number): Observable<Station> {
    return this.api.get<Station>(`stations/${id}`);
  }

  /** Actualiza la ficha configurable de una estación. */
  update(id: number, body: Partial<Station>): Observable<Station> {
    return this.api.put<Station>(`stations/${id}`, body);
  }
}
