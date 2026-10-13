import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AlertService } from '../../../../core/services/alert.service';
import { StationService } from '../../../../core/services/station.service';
import { Alert } from '../../../../core/models/alert.model';
import { Station } from '../../../../core/models/station.model';
import { NivelAlerta } from '../../../../core/models/enums';

type Filtro = 'todos' | 'rojo' | 'naranja' | 'amarillo' | 'vigentes';

interface FilaAviso {
  alert: Alert;
  station?: Station;
}

@Component({
  selector: 'app-avisos-page',
  imports: [TableModule, TagModule, InputTextModule, FormsModule, RouterLink],
  templateUrl: './avisos-page.html',
  styleUrl: './avisos-page.scss',
})
export class AvisosPage implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly filas = signal<FilaAviso[]>([]);
  readonly filtro = signal<Filtro>('todos');
  readonly search = signal('');

  private stations: Station[] = [];

  async ngOnInit(): Promise<void> {
    try {
      const [alerts, stations] = await Promise.all([
        firstValueFrom(this.alertService.listar()),
        firstValueFrom(this.stationService.listar()),
      ]);
      this.stations = stations;
      const porCodigo = new Map(stations.map((s) => [s.codigo, s]));
      this.filas.set(alerts.map((a) => ({ alert: a, station: porCodigo.get(a.stationId) })));
    } finally {
      this.cargando.set(false);
    }
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

  cambiarFiltro(f: Filtro): void {
    this.filtro.set(f);
  }

  nivelColor(n: NivelAlerta): string {
    return { ROJO: '#dc2626', NARANJA: '#ea580c', AMARILLO: '#d97706' }[n];
  }
}
