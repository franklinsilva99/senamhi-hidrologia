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
import { ForecastService } from '../../../../core/services/forecast.service';
import { ObservationService } from '../../../../core/services/observation.service';
import { ConfigRecordService } from '../../../../core/services/config-record.service';
import { Station } from '../../../../core/models/station.model';
import { ForecastDiario, ForecastInput } from '../../../../core/models/forecast.model';
import { Umbrales } from '../../../../core/models/config-record.model';

const PERU_BOUNDS: L.LatLngBoundsExpression = [
  [-16.88, -80.32],
  [-1.43, -69.66],
];
// Colores del pronóstico (HidrogramaPronosticoPopup del PoC).
const C_ROJO = '#e60000';
const C_NARANJA = '#ff9900';
const C_AMARILLO = '#f9cf00';
const C_OBS = '#001eff';
const C_PRON = '#1d4ed8';

interface Punto {
  fecha: string;
  label: string;
  fechaLarga: string;
  real: number | null;
  pron: number | null;
  min?: number;
  max?: number;
  rango?: [number, number] | null;
}

@Component({
  selector: 'app-pronostico-page',
  imports: [ButtonModule, ProgressSpinnerModule, NgxEchartsDirective, TopicBanner],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './pronostico-page.html',
  styleUrl: './pronostico-page.scss',
})
export class PronosticoPage implements OnInit, AfterViewInit {
  private readonly stationService = inject(StationService);
  private readonly forecastService = inject(ForecastService);
  private readonly observationService = inject(ObservationService);
  private readonly configRecordService = inject(ConfigRecordService);

  readonly cargando = signal(true);
  readonly estaciones = signal<Station[]>([]);

  readonly seleccionada = signal<Station | null>(null);
  readonly titulo = signal('');
  readonly subtitulo = signal('');
  readonly hidrograma = signal<EChartsCoreOption | null>(null);

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private forecast: ForecastDiario[] = [];
  private inputs: ForecastInput[] = [];
  private umbrales: Umbrales = { amarilla: 0, naranja: 0, roja: 0 };
  private caudalPromedio: Record<string, number> = {};

  async ngOnInit(): Promise<void> {
    try {
      const [stations, diario, inputs] = await Promise.all([
        firstValueFrom(this.stationService.listar()),
        firstValueFrom(this.forecastService.diario()),
        firstValueFrom(this.forecastService.inputs()),
      ]);
      const conPronostico = new Set(diario.map((f) => f.stationId));
      this.estaciones.set(stations.filter((s) => conPronostico.has(s.codigo)));
      this.forecast = diario;
      this.inputs = inputs;
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

  async seleccionar(s: Station): Promise<void> {
    this.seleccionada.set(s);
    this.titulo.set(`Hidrograma de Caudal Pronosticado del Río ${s.rio.toUpperCase()}`);
    this.subtitulo.set(`Estación ${s.estacion.toUpperCase()}`);
    this.renderizarMarcadores();

    const [record, caudalPromedio] = await Promise.all([
      firstValueFrom(this.configRecordService.vigente(s.codigo, s.preferencia ?? 'caudal', hoy())),
      firstValueFrom(this.observationService.caudalPromedioDiario(s.id)),
    ]);
    this.umbrales = record.umbrales[s.tipo ?? 'avenida'] ?? { amarilla: 0, naranja: 0, roja: 0 };
    this.caudalPromedio = caudalPromedio;
    this.reconstruirGrafico();
  }

  cerrar(): void {
    this.seleccionada.set(null);
    this.hidrograma.set(null);
    this.renderizarMarcadores();
  }

  private iniciarMapa(): void {
    this.map = L.map('mapa-pronostico', { scrollWheelZoom: false });
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
    for (const s of this.estaciones()) {
      const seleccionado = this.seleccionada()?.id === s.id;
      const marker = L.marker([s.lat, s.lon], {
        icon: dotIcon(seleccionado ? 8.5 : 7.5),
      })
        .addTo(this.map)
        .bindTooltip(s.estacion, { direction: 'top', offset: [0, -16] });
      marker.on('click', () => void this.seleccionar(s));
      this.markers.push(marker);
    }
  }

  private reconstruirGrafico(): void {
    const s = this.seleccionada();
    if (!s) {
      return;
    }
    const forecast = this.forecast.filter((f) => f.stationId === s.codigo);
    const inputs = this.inputs.filter((i) => i.stationId === s.codigo);
    this.hidrograma.set(this.construirOpcion(forecast, inputs));
  }

  private construirOpcion(forecast: ForecastDiario[], inputs: ForecastInput[]): EChartsCoreOption {
    const minMaxPorDia = new Map<string, number[]>();
    for (const i of inputs) {
      const arr = minMaxPorDia.get(i.fecha) ?? [];
      arr.push(i.valor);
      minMaxPorDia.set(i.fecha, arr);
    }

    const porFecha = new Map(forecast.map((f) => [f.fecha, f]));
    const fechasForecast = [...porFecha.keys()].sort();
    const ultima = fechasForecast[fechasForecast.length - 1];
    const data: Punto[] = [];
    if (ultima) {
      const ventana = Math.max(6, fechasForecast.length);
      for (let i = ventana - 1; i >= 0; i--) {
        const fecha = addDias(ultima, -i);
        const f = porFecha.get(fecha);
        if (f) {
          const vals = minMaxPorDia.get(fecha) ?? [];
          const min = vals.length ? Math.min(...vals) : f.caudalPrevisto;
          const max = vals.length ? Math.max(...vals) : f.caudalPrevisto;
          data.push({
            fecha,
            label: fmtCorto(fecha),
            fechaLarga: fmtLargo(fecha),
            real: null,
            pron: f.caudalPrevisto,
            min,
            max,
            rango: [min, max],
          });
        } else {
          const real = this.caudalPromedio[fecha] ?? null;
          data.push({
            fecha,
            label: fmtCorto(fecha),
            fechaLarga: fmtLargo(fecha),
            real,
            pron: null,
            rango: null,
          });
        }
      }
      // Encadena la línea punteada desde el último día observado.
      const lastReal = [...data].reverse().find((d) => d.real != null);
      if (lastReal && data.some((d) => d.pron != null)) {
        lastReal.pron = lastReal.real;
        if (lastReal.real != null) {
          lastReal.rango = [lastReal.real, lastReal.real];
        }
      }
    }

    const labels = data.map((d) => d.label);
    const rangos = data.map((d) => d.rango ?? null);
    const reales = data.map((d) => d.real);
    const prons = data.map((d) => d.pron);

    const valores = data.flatMap((d) => [d.real, d.pron, d.min, d.max]).filter(
      (v): v is number => v != null,
    );
    const yMax =
      Math.max(this.umbrales.roja, this.umbrales.naranja, this.umbrales.amarilla, ...valores) *
      1.12;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const list = params as Array<{ dataIndex: number }>;
          const p = data[list[0].dataIndex];
          const num = (v?: number | null) => (v == null ? '—' : String(Number(v.toFixed(2))));
          return [
            p.fechaLarga,
            `Rojo: ${num(this.umbrales.roja)}`,
            `Naranja: ${num(this.umbrales.naranja)}`,
            `Amarillo: ${num(this.umbrales.amarilla)}`,
            `Min - Max: ${num(p.min)} - ${num(p.max)}`,
            `Caudal Promedio: ${num(p.real)}`,
            `Caudal Pronosticado: ${num(p.pron)}`,
          ].join('<br/>');
        },
      },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value', name: 'CAUDAL (m3/s)', min: 0, max: yMax },
      series: [
        {
          name: 'rango',
          type: 'line',
          data: rangos,
          lineStyle: { opacity: 0 },
          areaStyle: { color: C_PRON, opacity: 0.18 },
          symbol: 'none',
          z: 1,
          tooltip: { show: false },
        },
        {
          name: 'Caudal Promedio',
          type: 'line',
          data: reales,
          connectNulls: false,
          lineStyle: { color: C_OBS, width: 2.2 },
          symbol: 'none',
          z: 2,
        },
        {
          name: 'Caudal Pronosticado',
          type: 'line',
          data: prons,
          connectNulls: true,
          lineStyle: { color: C_PRON, width: 2.2, type: 'dashed' },
          symbol: 'none',
          z: 2,
          markLine: {
            silent: true,
            symbol: 'none',
            label: { show: false },
            data: [
              { yAxis: this.umbrales.amarilla, lineStyle: { color: C_AMARILLO, width: 2 } },
              { yAxis: this.umbrales.naranja, lineStyle: { color: C_NARANJA, width: 2 } },
              { yAxis: this.umbrales.roja, lineStyle: { color: C_ROJO, width: 2 } },
            ],
          },
        },
      ],
    };
  }
}

/** Círculo azul (igual que `stationDotIcon` del PoC). */
function dotIcon(r: number): L.DivIcon {
  const html =
    `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="14" cy="14" r="${r}" fill="#4682B4" stroke="#073763" stroke-width="1.5"/>` +
    `</svg>`;
  return L.divIcon({ className: 'marker-estacion', iconSize: [28, 28], iconAnchor: [14, 14], html });
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function fmtCorto(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  if (isNaN(d.getTime())) return fecha;
  return `${d.getDate()}. ${MESES[d.getMonth()]}`;
}

function fmtLargo(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  if (isNaN(d.getTime())) return fecha;
  return `${DIAS[d.getDay()]}, ${MESES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function addDias(fecha: string, dias: number): string {
  const d = new Date(fecha + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hoy(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
