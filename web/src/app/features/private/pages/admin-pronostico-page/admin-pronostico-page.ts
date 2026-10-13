import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

import { ForecastService } from '../../../../core/services/forecast.service';
import { StationService } from '../../../../core/services/station.service';
import { Station } from '../../../../core/models/station.model';
import { ForecastInput } from '../../../../core/models/forecast.model';

const MODELOS = ['Modelo 1', 'Modelo 2', 'Modelo 3', 'Modelo 4'];

@Component({
  selector: 'app-admin-pronostico-page',
  imports: [TableModule, ButtonModule, FormsModule],
  templateUrl: './admin-pronostico-page.html',
  styleUrl: './admin-pronostico-page.scss',
})
export class AdminPronosticoPage implements OnInit {
  private readonly forecastService = inject(ForecastService);
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly stations = signal<Station[]>([]);
  readonly inputs = signal<ForecastInput[]>([]);

  formDZ = '';
  formStation = '';
  fecha: string = hoy();
  modelos: Record<string, Record<number, string>> = {};
  readonly guardado = signal(false);
  readonly mensaje = signal('');

  get dzList(): string[] {
    return [...new Set(this.stations().map((s) => s.dz).filter((d): d is string => !!d))];
  }

  get estacionesFiltradas(): Station[] {
    return this.formDZ ? this.stations().filter((s) => s.dz === this.formDZ) : this.stations();
  }

  get dias(): string[] {
    return [0, 1, 2].map((i) => sumarDias(this.fecha, i));
  }

  async ngOnInit(): Promise<void> {
    try {
      const [stations, inputs] = await Promise.all([
        firstValueFrom(this.stationService.listar()),
        firstValueFrom(this.forecastService.inputs()),
      ]);
      this.stations.set(stations);
      this.inputs.set(inputs);
    } finally {
      this.cargando.set(false);
    }
  }

  valorCelda(fecha: string, idx: number): string {
    return this.modelos[fecha]?.[idx] ?? '';
  }

  setModelo(fecha: string, idx: number, valor: string): void {
    this.modelos = { ...this.modelos, [fecha]: { ...this.modelos[fecha], [idx]: valor } };
  }

  async guardar(): Promise<void> {
    if (!this.formStation) return;
    const nuevos: Omit<ForecastInput, 'id'>[] = [];
    for (const fecha of this.dias) {
      const celdas = this.modelos[fecha];
      if (!celdas) continue;
      for (let idx = 0; idx < 4; idx++) {
        const raw = celdas[idx];
        if (raw == null || raw.trim() === '') continue;
        const valor = parseFloat(raw);
        if (isNaN(valor)) continue;
        nuevos.push({
          stationId: this.formStation,
          fecha,
          modelo: MODELOS[idx],
          valor,
          usuario: 'operador-DZ',
          padre: this.fecha,
        });
      }
    }
    if (nuevos.length === 0) return;
    for (const n of nuevos) {
      await firstValueFrom(this.forecastService.createInput(n));
    }
    this.inputs.set(await firstValueFrom(this.forecastService.inputs()));
    this.modelos = {};
    this.guardado.set(true);
    this.mensaje.set('Modelos guardados correctamente.');
  }
}

function sumarDias(base: string, dias: number): string {
  const d = new Date(base + 'T00:00:00');
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
