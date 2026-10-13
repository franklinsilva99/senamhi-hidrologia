import { NivelAlerta, TipoAviso, Variable } from './enums';
import { ObservationView } from './observation.model';
import { Umbrales } from './config-record.model';

/** Aviso hidrológico. */
export interface Alert {
  nro: number;
  ca: string;
  ce: string;
  stationId: string;
  titulo: string;
  cuerpoAgua: string;
  distrito: string;
  inicio: string;
  fin: string;
  duracionHoras: number;
  nivel: NivelAlerta;
  plazo: string;
  vigente: boolean;
  fechaEmision: string;
  descripcion: string;
  recomendaciones: string;
  validadoDZ: boolean;
  poblados: string[];
  caudalActual?: number;
  nivelActual?: number;
  preferencia: Variable;
  tipo: TipoAviso;
  cota?: number | null;
  umbrales?: Umbrales;
  serie?: ObservationView[];
}
