import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as echarts from 'echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { RouterLink } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { TopicBanner } from '../../../../shared/components/topic-banner/topic-banner';

import { AlertService } from '../../../../core/services/alert.service';
import { StationService } from '../../../../core/services/station.service';
import { Alert } from '../../../../core/models/alert.model';
import { Station } from '../../../../core/models/station.model';
import { ObservationView } from '../../../../core/models/observation.model';
import { Umbrales } from '../../../../core/models/config-record.model';
import { NivelAlerta, TipoAviso } from '../../../../core/models/enums';

// Colores del gráfico (ChartAviso del PoC).
const C_AMARILLO = '#ffeb3b';
const C_NARANJA = '#fca326';
const C_ROJO = '#ee3d43';
const C_LINEA = '#0000ff';

// Colores del badge y la leyenda (LeyendaNiveles del PoC).
const BADGE: Record<NivelAlerta, { bg: string; color: string }> = {
  AMARILLO: { bg: '#FFFF00', color: '#000000' },
  NARANJA: { bg: '#FF9900', color: '#ffffff' },
  ROJO: { bg: '#FF0000', color: '#ffffff' },
};

const PELIGRO: Record<TipoAviso, Record<NivelAlerta, string>> = {
  avenida: {
    AMARILLO: 'Indica condiciones normales del río con la posibilidad de incremento en su nivel.',
    NARANJA:
      'Indica condiciones del río con tendencia ascendente en su nivel, con posibilidad de alcanzar el umbral rojo.',
    ROJO: 'Indica condiciones de peligro por el incremento del nivel o caudal del río, con posible desborde e inundación de zonas ribereñas. Se recomienda evitar cualquier actividad cercana al cauce.',
  },
  vigilancia: {
    AMARILLO: 'Indica condiciones normales del río con la posibilidad de descenso en su nivel.',
    NARANJA: 'Indica condiciones del río con tendencia descendente en su nivel.',
    ROJO: 'Indica condiciones donde se esperan limitaciones en el transporte fluvial ocasionado por el avistamiento de rocas y obstáculos debido a un mayor descenso en el nivel del río, que puede generar daños y el encallamiento de naves fluviales.',
  },
};

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

@Component({
  selector: 'app-aviso-detalle-page',
  imports: [NgxEchartsDirective, TopicBanner, RouterLink],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './aviso-detalle-page.html',
  styleUrl: './aviso-detalle-page.scss',
})
export class AvisoDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);
  private readonly stationService = inject(StationService);

  readonly aviso = signal<Alert | null>(null);
  readonly station = signal<Station | null>(null);
  readonly noEncontrado = signal(false);
  readonly opcionChart = signal<EChartsCoreOption | null>(null);
  readonly BADGE_COLOR = BADGE;

  get badge(): { bg: string; color: string } | null {
    const a = this.aviso();
    return a ? BADGE[a.nivel] : null;
  }

  get peligros(): Array<{ nivel: NivelAlerta; texto: string; bg: string; color: string }> {
    const a = this.aviso();
    if (!a) return [];
    return (['ROJO', 'NARANJA', 'AMARILLO'] as NivelAlerta[]).map((nivel) => ({
      nivel,
      texto: PELIGRO[a.tipo][nivel],
      bg: BADGE[nivel].bg,
      color: BADGE[nivel].color,
    }));
  }

  get etiquetaActual(): string {
    const a = this.aviso();
    if (!a) return '';
    const esNivel = a.preferencia === 'nivel';
    const unidad = esNivel ? 'm.s.n.m.' : 'm³/s';
    return esNivel ? `Nivel actual (${unidad})` : `Caudal actual (${unidad})`;
  }

  get valorActual(): number | undefined {
    const a = this.aviso();
    return a ? (a.preferencia === 'nivel' ? a.nivelActual : a.caudalActual) : undefined;
  }

  get umbralRojoAbs(): number | undefined {
    const a = this.aviso();
    const u = a?.umbrales;
    if (!a || !u) return undefined;
    const offset = a.preferencia === 'nivel' && a.cota != null ? (a.cota as number) : 0;
    return u.roja + offset;
  }

  async ngOnInit(): Promise<void> {
    const ca = this.route.snapshot.paramMap.get('ca');
    if (!ca) {
      this.noEncontrado.set(true);
      return;
    }
    try {
      const [aviso, stations] = await Promise.all([
        firstValueFrom(this.alertService.porCa(ca)),
        firstValueFrom(this.stationService.listar()),
      ]);
      this.aviso.set(aviso);
      this.station.set(stations.find((s) => s.codigo === aviso.stationId) ?? null);
      this.construirGrafico(aviso);
    } catch {
      this.noEncontrado.set(true);
    }
  }

  formatFechaES(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }

  private construirGrafico(aviso: Alert): void {
    const serie = aviso.serie ?? [];
    const isNivel = aviso.preferencia === 'nivel';
    const tieneCota = isNivel && aviso.cota != null;
    const offset = tieneCota ? (aviso.cota as number) : 0;
    const unidad = isNivel ? (tieneCota ? 'm.s.n.m.' : 'm') : 'm³/s';
    const varName = isNivel ? 'Nivel' : 'Caudal';

    const valores = serie.map((o) => (isNivel ? o.nivel : o.caudal) + offset);
    const fechas = serie.map((o) => o.fecha);

    const u: Umbrales | undefined = aviso.umbrales;
    const a = (u?.amarilla ?? 0) + offset;
    const n = (u?.naranja ?? 0) + offset;
    const r = (u?.roja ?? 0) + offset;

    const dMin = valores.length ? Math.min(...valores) : a;
    const dMax = valores.length ? Math.max(...valores) : r;
    const pad = 0.05 * Math.abs(r - a) || Math.abs(r) * 0.02 || 1;
    const bottom =
      aviso.tipo === 'vigilancia' ? r - 1.4 * (n - r) : Math.min(dMin, a - (n - a)) - pad;
    const top =
      aviso.tipo === 'vigilancia' ? Math.max(dMax, a + (a - n)) + pad : r + 1.4 * (r - n);

    const bandas =
      aviso.tipo === 'vigilancia'
        ? [
            [{ yAxis: bottom, itemStyle: { color: C_ROJO } }, { yAxis: r }],
            [{ yAxis: r, itemStyle: { color: C_NARANJA } }, { yAxis: n }],
            [{ yAxis: n, itemStyle: { color: C_AMARILLO } }, { yAxis: a }],
          ]
        : [
            [{ yAxis: a, itemStyle: { color: C_AMARILLO } }, { yAxis: n }],
            [{ yAxis: n, itemStyle: { color: C_NARANJA } }, { yAxis: r }],
            [{ yAxis: r, itemStyle: { color: C_ROJO } }, { yAxis: top }],
          ];

    this.opcionChart.set({
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
      yAxis: { type: 'value', name: `${varName} (${unidad})`, min: bottom, max: top },
      series: [
        {
          name: varName,
          type: 'line',
          data: valores,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: C_LINEA, width: 1.5 },
          z: 10,
          markArea: {
            silent: true,
            data: bandas,
            itemStyle: { opacity: 0.2 },
          },
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
    });
  }
}
