import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../shared/services/api.service';
import { DeteccionAviso } from '../models/detection.model';

@Injectable({ providedIn: 'root' })
export class DetectionService {
  private readonly api = inject(ApiService);

  /** Clasifica el último dato de cada estación contra sus umbrales. */
  detectar(): Observable<DeteccionAviso[]> {
    return this.api.get<DeteccionAviso[]>('detection');
  }
}
