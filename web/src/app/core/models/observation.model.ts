/** Lectura horaria unida (nivel + caudal por fecha). */
export interface ObservationView {
  stationId: string;
  fecha: string;
  nivel: number;
  caudal: number;
}
