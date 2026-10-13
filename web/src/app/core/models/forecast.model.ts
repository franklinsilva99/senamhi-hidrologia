/** Pronóstico diario (promedio de modelos) para una estación/fecha. */
export interface ForecastDiario {
  stationId: string;
  fecha: string;
  caudalPrevisto: number;
  nModelos: number;
  modelos: string[];
  precision: string;
}

/** Modelo de pronóstico ingresado por la DZ. */
export interface ForecastInput {
  id: number;
  stationId: string;
  fecha: string;
  modelo: string;
  valor: number;
  usuario: string;
  padre?: string;
}
