import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { StationService } from '../../../../core/services/station.service';
import { DetectionService } from '../../../../core/services/detection.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Station } from '../../../../core/models/station.model';
import { DeteccionAviso } from '../../../../core/models/detection.model';
import { Alert } from '../../../../core/models/alert.model';
import { NIVEL_COLOR, NIVEL_LABEL, SIN_EXCESO_COLOR } from '../../../../core/models/enums';

interface FilaEstacion {
  station: Station;
  deteccion: DeteccionAviso | undefined;
}

@Component({
  selector: 'app-home-page',
  imports: [CardModule, TableModule, TagModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private readonly stationService = inject(StationService);
  private readonly detectionService = inject(DetectionService);
  private readonly alertService = inject(AlertService);

  readonly estaciones = signal<FilaEstacion[]>([]);
  readonly avisosVigentes = signal<Alert[]>([]);
  readonly cargando = signal(true);

  get totalEstaciones(): number {
    return this.estaciones().length;
  }

  get totalEnAlerta(): number {
    return this.estaciones().filter((e) => e.deteccion?.excedido).length;
  }

  get totalAvisosVigentes(): number {
    return this.avisosVigentes().length;
  }

  async ngOnInit(): Promise<void> {
    try {
      const [stations, detecciones, alerts] = await Promise.all([
        firstValueFrom(this.stationService.listar()),
        firstValueFrom(this.detectionService.detectar()),
        firstValueFrom(this.alertService.listar()),
      ]);
      const porCodigo = new Map(detecciones.map((d) => [d.stationId, d]));
      this.estaciones.set(stations.map((s) => ({ station: s, deteccion: porCodigo.get(s.codigo) })));
      this.avisosVigentes.set(alerts.filter((a) => a.vigente));
    } finally {
      this.cargando.set(false);
    }
  }

  nivelDe(fila: FilaEstacion): string {
    const u = fila.deteccion?.umbral;
    return u ? NIVEL_LABEL[u] : 'Sin exceso';
  }

  tagStyle(fila: FilaEstacion): Record<string, string> {
    const u = fila.deteccion?.umbral;
    if (!u) {
      return { background: SIN_EXCESO_COLOR, color: '#ffffff' };
    }
    return { background: NIVEL_COLOR[u], color: u === 'AMARILLO' ? '#000000' : '#ffffff' };
  }
}
