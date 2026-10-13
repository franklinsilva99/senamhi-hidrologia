import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import * as echarts from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TopicBanner } from '../../../../shared/components/topic-banner/topic-banner';

import { StationService } from '../../../../core/services/station.service';
import { DetectionService } from '../../../../core/services/detection.service';
import { ObservationService } from '../../../../core/services/observation.service';
import { ConfigRecordService } from '../../../../core/services/config-record.service';
import { Station } from '../../../../core/models/station.model';
import { DeteccionAviso } from '../../../../core/models/detection.model';
import { ObservationView } from '../../../../core/models/observation.model';
import { ConfigRecord, Umbrales } from '../../../../core/models/config-record.model';
import { ESTADO_COLOR, NIVEL_A_ESTADO, TipoAviso, Variable } from '../../../../core/models/enums';

// Límites del Perú (igual que el PoC) y colores del gráfico (ChartHydro del PoC).
const PERU_BOUNDS: L.LatLngBoundsExpression = [
  [-16.88, -80.32],
  [-1.43, -69.66],
];
const C_AMARILLO = '#ffeb3b';
const C_NARANJA = '#fca326';
const C_ROJO = '#ee3d43';
const C_LINEA = '#0000ff';

interface FilaEstacion {
  station: Station;
  deteccion: DeteccionAviso | undefined;
}

@Component({
  selector: 'app-monitoreo-page',
  imports: [ButtonModule, ProgressSpinnerModule, NgxEchartsDirective, TopicBanner],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './monitoreo-page.html',
  styleUrl: './monitoreo-page.scss',
})
export class MonitoreoPage implements OnInit, AfterViewInit {
  private readonly stationService = inject(StationService);
  private readonly detectionService = inject(DetectionService);
  private readonly observationService = inject(ObservationService);
  private readonly configRecordService = inject(ConfigRecordService);

  readonly cargando = signal(true);
  readonly estaciones = signal<FilaEstacion[]>([]);

  readonly seleccionada = signal<Station | null>(null);
  readonly tituloHidrograma = signal('');
  readonly subtituloHidrograma = signal('');
  readonly variable = signal<Variable>('caudal');
  readonly granularidad = signal<'horario' | 'diario'>('horario');
  readonly hidrograma = signal<EChartsCoreOption | null>(null);

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private serie: ObservationView[] = [];
  private record: ConfigRecord | null = null;

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
    const s = fila.station;
    this.seleccionada.set(s);
    this.variable.set(s.preferencia ?? 'caudal');
    this.granularidad.set('horario');
    this.tituloHidrograma.set(`Hidrograma de ${s.rio.toUpperCase()}`);
    this.subtituloHidrograma.set(`Estación ${s.estacion.toUpperCase()}`);
    this.renderizarMarcadores();
    void this.cargar(s);
  }

  cerrar(): void {
    this.seleccionada.set(null);
    this.hidrograma.set(null);
    this.serie = [];
    this.record = null;
    this.renderizarMarcadores();
  }

  cambiarVariable(v: Variable): void {
    this.variable.set(v);
    void this.cargarRecord();
  }

  cambiarGranularidad(g: 'horario' | 'diario'): void {
    this.granularidad.set(g);
    this.reconstruirGrafico();
  }

  // ── Mapa ────────────────────────────────────────────────────────────────────

  private iniciarMapa(): void {
    this.map = L.map('mapa-estaciones', { scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.fitBounds(PERU_BOUNDS, { padding: [8, 8] });
    this.renderizarMarcadores();
  }

  private renderizarMarcadores(): void {
    if (!this.map) {
      return;
    }
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    for (const fila of this.estaciones()) {
      const marker = L.marker([fila.station.lat, fila.station.lon], {
        icon: this.iconoDe(fila),
      })
        .addTo(this.map)
        .bindTooltip(fila.station.estacion, { direction: 'top', offset: [0, -16] });
      marker.on('click', () => this.seleccionar(fila));
      this.markers.push(marker);
    }
  }

  private iconoDe(fila: FilaEstacion): L.DivIcon {
    const seleccionado = this.seleccionada()?.id === fila.station.id;
    return L.divIcon({
      className: 'marker-estacion',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: dotGlyph(this.colorDe(fila), seleccionado ? 8.5 : 7.5),
    });
  }

  /** Color del punto según su estado, igual que `colorDe` del PoC. */
  private colorDe(fila: FilaEstacion): string {
    if (fila.station.estado === 'mantenimiento') {
      return ESTADO_COLOR.mantenimiento;
    }
    const u = fila.deteccion?.umbral;
    return u ? ESTADO_COLOR[NIVEL_A_ESTADO[u]] : ESTADO_COLOR.normal;
  }

  // ── Hidrograma ──────────────────────────────────────────────────────────────

  private async cargar(s: Station): Promise<void> {
    this.serie = await firstValueFrom(this.observationService.serieFusionada(s.id, 72));
    await this.cargarRecord();
  }

  private async cargarRecord(): Promise<void> {
    const s = this.seleccionada();
    if (!s) {
      return;
    }
    try {
      this.record = await firstValueFrom(
        this.configRecordService.vigente(s.codigo, this.variable(), hoy()),
      );
    } catch {
      this.record = null;
    }
    this.reconstruirGrafico();
  }

  private reconstruirGrafico(): void {
    if (!this.seleccionada()) {
      return;
    }
    this.hidrograma.set(this.construirOpcion());
  }

  private construirOpcion(): EChartsCoreOption {
    const s = this.seleccionada()!;
    const variable = this.variable();
    const isNivel = variable === 'nivel';
    const tipo: TipoAviso = s.tipo ?? 'avenida';
    const cota = s.cota;
    const tieneCota = isNivel && cota != null;
    const offset = tieneCota ? (cota as number) : 0;
    const unidad = isNivel ? (tieneCota ? 'm.s.n.m.' : 'm') : 'm³/s';
    const varName = isNivel ? 'Nivel' : 'Caudal';

    const serie = this.granularidad() === 'diario' ? promedioDiario(this.serie) : this.serie;
    const fechas = serie.map((o) => o.fecha);
    const valores = serie.map((o) => (isNivel ? o.nivel : o.caudal) + offset);

    const u: Umbrales | undefined = this.record?.umbrales[tipo];
    const a = (u?.amarilla ?? 0) + offset;
    const n = (u?.naranja ?? 0) + offset;
    const r = (u?.roja ?? 0) + offset;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number }>;
          const p = list[0];
          return [
            p.axisValue,
            `${varName} (${unidad}): ${p.value}`,
            `Umbral Rojo: ${r}`,
            `Umbral Naranja: ${n}`,
            `Umbral Amarillo: ${a}`,
          ].join('<br/>');
        },
      },
      xAxis: { type: 'category', data: fechas },
      yAxis: { type: 'value', name: `${varName} (${unidad})`, scale: true },
      series: [
        {
          name: varName,
          type: 'line',
          data: valores,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: C_LINEA, width: 1.5 },
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            data: [
              { yAxis: a, lineStyle: { color: C_AMARILLO, width: 2 } },
              { yAxis: n, lineStyle: { color: C_NARANJA, width: 2 } },
              { yAxis: r, lineStyle: { color: C_ROJO, width: 2 } },
            ],
          },
        },
      ],
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 24, bottom: 8 }],
    };
  }
}

/** Círculo SVG con relleno variable (igual que `dotColorGlyph` del PoC). */
function dotGlyph(fill: string, r: number): string {
  return (
    `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="14" cy="14" r="${r}" fill="${fill}" stroke="#073763" stroke-width="1.5"/>` +
    `</svg>`
  );
}

/** Promedio diario (igual que `promedioDiario` del PoC). */
function promedioDiario(series: ObservationView[]): ObservationView[] {
  const m = new Map<string, { c: number; l: number; count: number; stationId: string }>();
  for (const o of series) {
    const dia = o.fecha.slice(0, 10) + 'T00:00';
    const e = m.get(dia) ?? { c: 0, l: 0, count: 0, stationId: o.stationId };
    e.c += o.caudal;
    e.l += o.nivel;
    e.count++;
    m.set(dia, e);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, e]) => ({
      stationId: e.stationId,
      fecha,
      caudal: Math.round((e.c / e.count) * 10) / 10,
      nivel: Math.round((e.l / e.count) * 100) / 100,
    }));
}

/** Fecha local "YYYY-MM-DD". */
function hoy(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
