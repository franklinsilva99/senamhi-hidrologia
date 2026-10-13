import { ModoPublicacion, TipoAviso, Variable } from './enums';

export interface PobladoGeo {
  nombre: string;
  lat: number;
  lon: number;
}

/** Ficha de estación hidrológica. */
export interface Station {
  id: number;
  codigo: string;
  n: number;
  cuenca: string;
  estacion: string;
  rio: string;
  codigoAuto: string | null;
  codigoConvencional: string | null;
  dz: string | null;
  escalaTemporal: string;
  region: string;
  lat: number;
  lon: number;
  isEstimated: boolean;
  fuente: string;
  poblados: string[];
  pobladosGeo?: PobladoGeo[];
  polygon: unknown;
  departamento: string;
  provincia: string[];
  distritos: string[];
  variables: string[];
  preferencia?: Variable;
  tipo?: TipoAviso;
  modoPublicacion?: ModoPublicacion;
  estado?: string;
  cota: number | null;
  cotaFuente?: string;
}
