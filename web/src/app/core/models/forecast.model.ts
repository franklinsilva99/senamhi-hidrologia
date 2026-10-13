/** Pronóstico diario (promedio de modelos) para una estación/fecha. */
export interface ForecastDiario {
  stationId: string;
  fecha: string;
  caudalPrevisto: number;
  nModelos: number;
  modelos: string[];
  precision: string;
}
