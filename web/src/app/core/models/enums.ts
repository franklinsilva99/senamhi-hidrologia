/** Variable de medición de una estación. */
export type Variable = 'caudal' | 'nivel';

/** Tipo de aviso: avenida (mayor es peor) o vigilancia (menor es peor). */
export type TipoAviso = 'avenida' | 'vigilancia';

/** Nivel de alerta. */
export type NivelAlerta = 'AMARILLO' | 'NARANJA' | 'ROJO';

/** Modo de publicación de avisos por estación. */
export type ModoPublicacion = 'automatico' | 'manual';

export const NIVEL_LABEL: Record<NivelAlerta, string> = {
  AMARILLO: 'Amarillo',
  NARANJA: 'Naranja',
  ROJO: 'Rojo',
};

/** Colores SENAMHI por nivel de alerta. */
export const NIVEL_COLOR: Record<NivelAlerta, string> = {
  AMARILLO: '#fbfb05',
  NARANJA: '#ffa500',
  ROJO: '#fb0505',
};

/** Color para estaciones sin umbral excedido. */
export const SIN_EXCESO_COLOR = '#16a34a';
