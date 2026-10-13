import { NivelAlerta, TipoAviso, Variable } from './enums';

/** Resultado de la clasificación de una estación contra sus umbrales. */
export interface DeteccionAviso {
  stationId: string;
  valorActual: number;
  valorAbsoluto?: number;
  umbral: NivelAlerta | null;
  preferencia: Variable;
  tipo: TipoAviso;
  excedido: boolean;
}
