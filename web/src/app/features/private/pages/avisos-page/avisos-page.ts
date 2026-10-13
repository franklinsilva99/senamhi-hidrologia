import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AlertService } from '../../../../core/services/alert.service';
import { StationService } from '../../../../core/services/station.service';
import { Alert } from '../../../../core/models/alert.model';
import { Station } from '../../../../core/models/station.model';
import { NivelAlerta, TipoAviso } from '../../../../core/models/enums';

type Filtro = 'todos' | 'rojo' | 'naranja' | 'amarillo' | 'vigentes';
type Tab = 'lista' | 'mapa';

interface FilaAviso {
  alert: Alert;
  station?: Station;
}

const PERU_BOUNDS: L.LatLngBoundsExpression = [
  [-16.88, -80.32],
  [-1.43, -69.66],
];

const ESTADO_COLOR: Record<string, string> = {
  normal: '#fbfdfc',
  amarilla: '#ffeb3b',
  naranja: '#fca326',
  roja: '#ee3d43',
};

const NIVEL_A_ESTADO: Record<NivelAlerta, string> = {
  AMARILLO: 'amarilla',
  NARANJA: 'naranja',
  ROJO: 'roja',
};

const NIVEL_LABEL: Record<NivelAlerta, string> = {
  AMARILLO: 'Amarillo',
  NARANJA: 'Naranja',
  ROJO: 'Rojo',
};

const NIVEL_SENAMHI: Record<NivelAlerta, { bg: string; text: string }> = {
  AMARILLO: { bg: '#fbfb05', text: '#000000' },
  NARANJA: { bg: '#ffa500', text: '#ffffff' },
  ROJO: { bg: '#fb0505', text: '#ffffff' },
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

const RECOMENDACION: Record<TipoAviso, Record<NivelAlerta, string>> = {
  avenida: {
    AMARILLO: 'Seguir reportes de la DZ. Mantenerse informado por la web institucional del SENAMHI.',
    NARANJA:
      'Evitar cruce de cauce, alejar bienes de riberas. Mantenerse informado por la web institucional del SENAMHI.',
    ROJO: 'Evitar cruzar el cauce, alejar bienes de riberas. Seguir indicaciones de la DZ y COEN.',
  },
  vigilancia: {
    AMARILLO: 'Vigilar el descenso del nivel del río. Mantenerse informado por la web institucional del SENAMHI.',
    NARANJA:
      'Precaución por la tendencia descendente del nivel. Mantenerse informado por la web institucional del SENAMHI.',
    ROJO: 'Restringir la navegación y actividades fluviales por el descenso del nivel. Seguir indicaciones de la DZ y COEN.',
  },
};

@Component({
  selector: 'app-avisos-page',
  imports: [TableModule, InputTextModule, FormsModule, RouterLink],
  templateUrl: './avisos-page.html',
  styleUrl: './avisos-page.scss',
})
export class AvisosPage implements OnInit, AfterViewInit {
  private readonly alertService = inject(AlertService);
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly filas = signal<FilaAviso[]>([]);
  readonly filtro = signal<Filtro>('todos');
  readonly search = signal('');
  readonly tab = signal<Tab>('lista');

  readonly tipoActivo = signal<TipoAviso>('avenida');
  readonly nivelActivo = signal<NivelAlerta>('AMARILLO');

  private map?: L.Map;
  private markers: L.Marker[] = [];

  readonly SENAMHI_COLOR = NIVEL_SENAMHI;
  readonly LABEL_NIVEL = NIVEL_LABEL;

  get NIVELES(): NivelAlerta[] {
    return ['AMARILLO', 'NARANJA', 'ROJO'];
  }

  get counts(): Record<Filtro, number> {
    const f = this.filas();
    return {
      todos: f.length,
      rojo: f.filter((r) => r.alert.nivel === 'ROJO').length,
      naranja: f.filter((r) => r.alert.nivel === 'NARANJA').length,
      amarillo: f.filter((r) => r.alert.nivel === 'AMARILLO').length,
      vigentes: f.filter((r) => r.alert.vigente).length,
    };
  }

  get filtrados(): FilaAviso[] {
    const q = this.search().trim().toLowerCase();
    const filtro = this.filtro();
    return this.filas().filter((r) => {
      const a = r.alert;
      if (filtro === 'vigentes' && !a.vigente) return false;
      if (filtro === 'rojo' && a.nivel !== 'ROJO') return false;
      if (filtro === 'naranja' && a.nivel !== 'NARANJA') return false;
      if (filtro === 'amarillo' && a.nivel !== 'AMARILLO') return false;
      if (q) {
        const blob = `${a.titulo} ${a.nro} ${a.nivel} ${r.station?.estacion ?? ''} ${r.station?.rio ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }

  get vigentes(): FilaAviso[] {
    return this.filas().filter((r) => r.alert.vigente);
  }

  get peligroTexto(): string {
    return PELIGRO[this.tipoActivo()][this.nivelActivo()];
  }

  get recomendacionTexto(): string {
    return RECOMENDACION[this.tipoActivo()][this.nivelActivo()];
  }

  async ngOnInit(): Promise<void> {
    try {
      const [alerts, stations] = await Promise.all([
        firstValueFrom(this.alertService.listar()),
        firstValueFrom(this.stationService.listar()),
      ]);
      const porCodigo = new Map(stations.map((s) => [s.codigo, s]));
      this.filas.set(alerts.map((a) => ({ alert: a, station: porCodigo.get(a.stationId) })));
    } finally {
      this.cargando.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  cambiarTab(t: Tab): void {
    this.tab.set(t);
    if (t === 'mapa') {
      setTimeout(() => this.iniciarMapa());
    }
  }

  cambiarFiltro(f: Filtro): void {
    this.filtro.set(f);
  }

  nivelColor(n: NivelAlerta): string {
    return { ROJO: '#dc2626', NARANJA: '#ea580c', AMARILLO: '#d97706' }[n];
  }

  nivelDe(fila: FilaAviso): NivelAlerta {
    return fila.alert.nivel;
  }

  private iniciarMapa(): void {
    if (this.tab() !== 'mapa' || !document.getElementById('mapa-avisos')) return;
    if (!this.map) {
      this.map = L.map('mapa-avisos', { scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);
      this.map.fitBounds(PERU_BOUNDS, { padding: [8, 8] });
    }
    this.renderizarMarcadores();
  }

  private renderizarMarcadores(): void {
    if (!this.map) return;
    this.markers.forEach((m) => m.remove());
    this.markers = [];
    for (const fila of this.vigentes) {
      const s = fila.station;
      if (!s) continue;
      const fill = ESTADO_COLOR[NIVEL_A_ESTADO[fila.alert.nivel]] ?? ESTADO_COLOR['normal'];
      const marker = L.marker([s.lat, s.lon], {
        icon: L.divIcon({
          className: 'marker-estacion',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="7.5" fill="${fill}" stroke="#073763" stroke-width="1.5"/></svg>`,
        }),
      })
        .addTo(this.map!)
        .bindTooltip(`Estación: ${s.estacion}`);
      marker.on('click', () => {
        this.tipoActivo.set(fila.alert.tipo);
        this.nivelActivo.set(fila.alert.nivel);
      });
      this.markers.push(marker);
    }
  }
}
