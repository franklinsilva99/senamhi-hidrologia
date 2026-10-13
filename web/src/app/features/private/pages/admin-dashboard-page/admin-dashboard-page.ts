import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';

import { StationService } from '../../../../core/services/station.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ForecastService } from '../../../../core/services/forecast.service';
import { Station } from '../../../../core/models/station.model';
import { Alert } from '../../../../core/models/alert.model';
import { ForecastDiario } from '../../../../core/models/forecast.model';
import { NivelAlerta } from '../../../../core/models/enums';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [CardModule, TableModule, TagModule, RouterLink],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly stationService = inject(StationService);
  private readonly alertService = inject(AlertService);
  private readonly forecastService = inject(ForecastService);

  readonly cargando = signal(true);
  readonly stations = signal<Station[]>([]);
  readonly alerts = signal<Alert[]>([]);
  readonly forecast = signal<ForecastDiario[]>([]);

  get totalEstaciones(): number {
    return this.stations().length;
  }
  get avisosVigentes(): number {
    return this.alerts().filter((a) => a.vigente).length;
  }
  get estacionesConPronostico(): number {
    return new Set(this.forecast().map((f) => f.stationId)).size;
  }
  get totalModelos(): number {
    return this.forecast().length;
  }

  async ngOnInit(): Promise<void> {
    try {
      const [stations, alerts, forecast] = await Promise.all([
        firstValueFrom(this.stationService.listar()),
        firstValueFrom(this.alertService.listar()),
        firstValueFrom(this.forecastService.diario()),
      ]);
      this.stations.set(stations);
      this.alerts.set(alerts);
      this.forecast.set(forecast);
    } finally {
      this.cargando.set(false);
    }
  }

  badgeStyle(nivel: NivelAlerta): Record<string, string> {
    return {
      AMARILLO: { background: '#ffeb3b', color: '#000000' },
      NARANJA: { background: '#fca326', color: '#ffffff' },
      ROJO: { background: '#ee3d43', color: '#ffffff' },
    }[nivel];
  }

  nombreEstacion(codigo: string): string {
    return this.stations().find((s) => s.codigo === codigo)?.estacion ?? codigo;
  }
}
