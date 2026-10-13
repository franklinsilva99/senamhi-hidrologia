import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import * as echarts from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { StationService } from '../../../../core/services/station.service';
import { DetectionService } from '../../../../core/services/detection.service';
import { ObservationService } from '../../../../core/services/observation.service';
import { Station } from '../../../../core/models/station.model';
import { DeteccionAviso } from '../../../../core/models/detection.model';
import { ObservationView } from '../../../../core/models/observation.model';
import { NIVEL_COLOR, NIVEL_LABEL, SIN_EXCESO_COLOR } from '../../../../core/models/enums';

interface FilaEstacion {
  station: Station;
  deteccion: DeteccionAviso | undefined;
}

@Component({
  selector: 'app-monitoreo-page',
  imports: [CardModule, TableModule, TagModule, ButtonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './monitoreo-page.html',
  styleUrl: './monitoreo-page.scss',
})
export class MonitoreoPage implements OnInit, AfterViewInit {
  private readonly stationService = inject(StationService);
  private readonly detectionService = inject(DetectionService);
  private readonly observationService = inject(ObservationService);

  readonly estaciones = signal<FilaEstacion[]>([]);
  readonly cargando = signal(true);
  readonly nombreSeleccionada = signal('');
  readonly hidrograma = signal<EChartsCoreOption | null>(null);

  private map?: L.Map;
  private markers: L.CircleMarker[] = [];

  async ngOnInit(): Promise<void> {
    try {
      const [stations, detecciones] = await Promise.all([
        firstValueFrom(this.stationService.listar()),
        firstValueFrom(this.detectionService.detectar()),
      ]);
      const porCodigo = new Map(detecciones.map((d) => [d.stationId, d]));
      this.estaciones.set(stations.map((s) => ({ station: s, deteccion: porCodigo.get(s.codigo) })));
      if (this.map) {
        this.renderizarMarcadores();
      }
    } finally {
      this.cargando.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  seleccionar(fila: FilaEstacion): void {
    this.nombreSeleccionada.set(fila.station.estacion);
    void this.cargarHidrograma(fila);
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

  private iniciarMapa(): void {
    this.map = L.map('mapa-estaciones', { center: [-11.5, -75.5], zoom: 6 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.renderizarMarcadores();
  }

  private renderizarMarcadores(): void {
    if (!this.map) {
      return;
    }
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    for (const fila of this.estaciones()) {
      const marker = L.circleMarker([fila.station.lat, fila.station.lon], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: this.colorDe(fila),
        fillOpacity: 0.9,
      })
        .addTo(this.map)
        .bindTooltip(`${fila.station.estacion} — ${this.nivelDe(fila)}`);
      marker.on('click', () => this.seleccionar(fila));
      this.markers.push(marker);
    }
  }

  private colorDe(fila: FilaEstacion): string {
    const u = fila.deteccion?.umbral;
    return u ? NIVEL_COLOR[u] : SIN_EXCESO_COLOR;
  }

  private async cargarHidrograma(fila: FilaEstacion): Promise<void> {
    const serie = await firstValueFrom(this.observationService.serieFusionada(fila.station.id, 72));
    this.hidrograma.set(this.construirOpcion(serie));
  }

  private construirOpcion(serie: ObservationView[]): EChartsCoreOption {
    const fechas = serie.map((o) => o.fecha);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Nivel (m)', 'Caudal (m³/s)'] },
      grid: { left: 60, right: 60, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: fechas },
      yAxis: [
        { type: 'value', name: 'Nivel (m)' },
        { type: 'value', name: 'Caudal (m³/s)' },
      ],
      series: [
        {
          name: 'Nivel (m)',
          type: 'line',
          data: serie.map((o) => o.nivel),
          smooth: true,
          showSymbol: false,
        },
        {
          name: 'Caudal (m³/s)',
          type: 'line',
          yAxisIndex: 1,
          data: serie.map((o) => o.caudal),
          smooth: true,
          showSymbol: false,
        },
      ],
    };
  }
}
