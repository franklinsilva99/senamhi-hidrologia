import { Variable } from './enums';

export interface Umbrales {
  amarilla: number;
  naranja: number;
  roja: number;
}

export interface UmbralesSet {
  avenida?: Umbrales;
  vigilancia?: Umbrales;
}

export interface Periodo {
  inicio: string;
  final: string | null;
}

export interface TiempoVigenciaHrs {
  amarilla: number;
  naranja: number;
  roja: number;
}

/** Registro de la tabla de configuración (umbrales + vigencia por estación/variable). */
export interface ConfigRecord {
  id: number;
  stationId: string;
  variable: Variable;
  periodo: Periodo;
  umbrales: UmbralesSet;
  tiempoVigenciaHrs: TiempoVigenciaHrs;
}
