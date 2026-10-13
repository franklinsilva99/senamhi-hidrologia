import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';

import { ConfigRecordService } from '../../../../core/services/config-record.service';
import { StationService } from '../../../../core/services/station.service';
import { ConfigRecord, Umbrales } from '../../../../core/models/config-record.model';
import { Station } from '../../../../core/models/station.model';

interface UmbralesForm {
  avAmarilla: number;
  avNaranja: number;
  avRoja: number;
  vigAmarilla: number;
  vigNaranja: number;
  vigRoja: number;
  vAmarilla: number;
  vNaranja: number;
  vRoja: number;
}

@Component({
  selector: 'app-admin-config-page',
  imports: [TableModule, ButtonModule, DialogModule, InputNumberModule, FormsModule],
  templateUrl: './admin-config-page.html',
  styleUrl: './admin-config-page.scss',
})
export class AdminConfigPage implements OnInit {
  private readonly configRecordService = inject(ConfigRecordService);
  private readonly stationService = inject(StationService);

  readonly cargando = signal(true);
  readonly records = signal<ConfigRecord[]>([]);
  readonly stations = signal<Station[]>([]);

  readonly editando = signal(false);
  readonly recordEditando = signal<ConfigRecord | null>(null);
  readonly form = signal<UmbralesForm>(this.vacio());

  private stationPorCodigo = new Map<string, Station>();

  async ngOnInit(): Promise<void> {
    try {
      const [records, stations] = await Promise.all([
        firstValueFrom(this.configRecordService.registros()),
        firstValueFrom(this.stationService.listar()),
      ]);
      this.records.set(records);
      this.stations.set(stations);
      this.stationPorCodigo = new Map(stations.map((s) => [s.codigo, s]));
    } finally {
      this.cargando.set(false);
    }
  }

  nombreDe(codigo: string): Station | undefined {
    return this.stationPorCodigo.get(codigo);
  }

  abrirEdicion(r: ConfigRecord): void {
    const av = r.umbrales.avenida;
    const vg = r.umbrales.vigilancia;
    const t = r.tiempoVigenciaHrs;
    this.recordEditando.set(r);
    this.form.set({
      avAmarilla: av?.amarilla ?? 0,
      avNaranja: av?.naranja ?? 0,
      avRoja: av?.roja ?? 0,
      vigAmarilla: vg?.amarilla ?? 0,
      vigNaranja: vg?.naranja ?? 0,
      vigRoja: vg?.roja ?? 0,
      vAmarilla: t?.amarilla ?? 0,
      vNaranja: t?.naranja ?? 0,
      vRoja: t?.roja ?? 0,
    });
    this.editando.set(true);
  }

  async guardar(): Promise<void> {
    const r = this.recordEditando();
    if (!r) return;
    const f = this.form();
    const avenida: Umbrales = { amarilla: f.avAmarilla, naranja: f.avNaranja, roja: f.avRoja };
    const vigilancia: Umbrales = {
      amarilla: f.vigAmarilla,
      naranja: f.vigNaranja,
      roja: f.vigRoja,
    };
    const record: ConfigRecord = {
      ...r,
      umbrales: { avenida, vigilancia },
      tiempoVigenciaHrs: { amarilla: f.vAmarilla, naranja: f.vNaranja, roja: f.vRoja },
    };
    const actualizado = await firstValueFrom(this.configRecordService.update(r.id, record));
    this.records.update((list) => list.map((x) => (x.id === r.id ? actualizado : x)));
    this.editando.set(false);
  }

  private vacio(): UmbralesForm {
    return {
      avAmarilla: 0,
      avNaranja: 0,
      avRoja: 0,
      vigAmarilla: 0,
      vigNaranja: 0,
      vigRoja: 0,
      vAmarilla: 0,
      vNaranja: 0,
      vRoja: 0,
    };
  }
}
