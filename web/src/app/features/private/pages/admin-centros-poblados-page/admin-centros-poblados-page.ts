import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

import { StationService } from '../../../../core/services/station.service';
import { Station, PobladoGeo } from '../../../../core/models/station.model';

interface PobladoEdit {
  nombre: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-admin-centros-poblados-page',
  imports: [TableModule, ButtonModule, DialogModule, InputTextModule, FormsModule],
  templateUrl: './admin-centros-poblados-page.html',
  styleUrl: './admin-centros-poblados-page.scss',
})
export class AdminCentrosPobladosPage implements OnInit {
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly stations = signal<Station[]>([]);
  readonly editando = signal(false);
  readonly estacionEditando = signal<Station | null>(null);
  readonly poblados = signal<PobladoEdit[]>([]);
  readonly mensaje = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.stations.set(await firstValueFrom(this.stationService.listar()));
    } finally {
      this.cargando.set(false);
    }
  }

  abrirEdicion(s: Station): void {
    this.estacionEditando.set(s);
    this.poblados.set(
      (s.pobladosGeo ?? []).map((p) => ({ nombre: p.nombre, lat: String(p.lat), lon: String(p.lon) })),
    );
    this.editando.set(true);
  }

  cerrar(): void {
    this.editando.set(false);
    this.estacionEditando.set(null);
  }

  agregar(): void {
    this.poblados.update((p) => [...p, { nombre: '', lat: '', lon: '' }]);
  }

  quitar(i: number): void {
    this.poblados.update((p) => p.filter((_, idx) => idx !== i));
  }

  async guardar(): Promise<void> {
    const s = this.estacionEditando();
    if (!s) return;
    const geo: PobladoGeo[] = this.poblados().map((p) => ({
      nombre: p.nombre,
      lat: parseFloat(p.lat) || 0,
      lon: parseFloat(p.lon) || 0,
    }));
    await firstValueFrom(
      this.stationService.update(s.id, { poblados: geo.map((g) => g.nombre), pobladosGeo: geo }),
    );
    this.stations.set(await firstValueFrom(this.stationService.listar()));
    this.mensaje.set(`Centros poblados guardados: ${s.estacion}`);
    this.cerrar();
  }
}
