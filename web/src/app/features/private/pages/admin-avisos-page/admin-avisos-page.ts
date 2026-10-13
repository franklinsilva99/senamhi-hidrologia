import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterLink } from '@angular/router';

import { AlertService } from '../../../../core/services/alert.service';
import { StationService } from '../../../../core/services/station.service';
import { Alert } from '../../../../core/models/alert.model';
import { Station } from '../../../../core/models/station.model';
import { NivelAlerta } from '../../../../core/models/enums';

@Component({
  selector: 'app-admin-avisos-page',
  imports: [TableModule, ButtonModule, TagModule, RouterLink],
  templateUrl: './admin-avisos-page.html',
  styleUrl: './admin-avisos-page.scss',
})
export class AdminAvisosPage implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly alerts = signal<Alert[]>([]);
  readonly mensaje = signal('');

  private stationPorCodigo = new Map<string, Station>();

  async ngOnInit(): Promise<void> {
    try {
      const [alerts, stations] = await Promise.all([
        firstValueFrom(this.alertService.listar()),
        firstValueFrom(this.stationService.listar()),
      ]);
      this.alerts.set(alerts);
      this.stationPorCodigo = new Map(stations.map((s) => [s.codigo, s]));
    } finally {
      this.cargando.set(false);
    }
  }

  nombre(codigo: string): string {
    return this.stationPorCodigo.get(codigo)?.estacion ?? codigo;
  }

  dz(codigo: string): string {
    return this.stationPorCodigo.get(codigo)?.dz ?? '—';
  }

  async actualizarDeteccion(): Promise<void> {
    const textos = await firstValueFrom(this.alertService.runDetection());
    this.mensaje.set(textos.length ? textos.join(' · ') : 'Sin cambios: ninguna estación supera umbrales.');
    this.alerts.set(await firstValueFrom(this.alertService.listar()));
  }

  async toggleVigente(a: Alert): Promise<void> {
    await firstValueFrom(this.alertService.patch(a.ca, { vigente: !a.vigente }));
    this.alerts.set(await firstValueFrom(this.alertService.listar()));
  }

  badgeStyle(nivel: NivelAlerta): Record<string, string> {
    return {
      AMARILLO: { background: '#ffeb3b', color: '#000000' },
      NARANJA: { background: '#fca326', color: '#ffffff' },
      ROJO: { background: '#ee3d43', color: '#ffffff' },
    }[nivel];
  }
}
