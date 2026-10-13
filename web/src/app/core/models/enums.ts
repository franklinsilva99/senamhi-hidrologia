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

/** Colores de nivel para badges (nav-pills SENAMHI, igual que el PoC). */
export const NIVEL_COLOR: Record<NivelAlerta, string> = {
  AMARILLO: '#fbfb05',
  NARANJA: '#ffa500',
  ROJO: '#fb0505',
};

/**
 * Colores de estado del mapa y el gráfico (igual que el PoC, `mapIcons.tsx`).
 */
export const ESTADO_COLOR = {
  normal: '#fbfdfc',
  amarilla: '#ffeb3b',
  naranja: '#fca326',
  roja: '#ee3d43',
  mantenimiento: '#9ca3af',
} as const;

export type EstadoColor = (typeof ESTADO_COLOR)[keyof typeof ESTADO_COLOR];

export const NIVEL_A_ESTADO: Record<NivelAlerta, keyof typeof ESTADO_COLOR> = {
  AMARILLO: 'amarilla',
  NARANJA: 'naranja',
  ROJO: 'roja',
};

/** Color para estaciones sin umbral excedido en tablas/badges. */
export const SIN_EXCESO_COLOR = '#16a34a';
