/**
 * Comparación de textos que tolera valores ausentes.
 *
 * Los ordenamientos por fecha o nombre asumían que el campo siempre venía, y
 * con un valor nulo la pantalla entera se caía con «Cannot read properties of
 * null». El Backend puede dejar campos sin valor —una bitácora sin marca de
 * tiempo, por ejemplo—, así que el orden los trata como vacíos y los deja al
 * final (23/09/2026).
 */
export function compararTextos(a: string | null | undefined, b: string | null | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a.localeCompare(b);
}

/**
 * Copia de la lista en orden alfabético del español, sin distinguir
 * mayúsculas ni tildes; los elementos sin texto van al final. Las listas de la
 * interfaz (selectores, chips, catálogos) se muestran así (26/09/2026).
 */
export function ordenAlfabetico<T>(
  items: readonly T[] | null | undefined,
  texto: (item: T) => string | null | undefined,
): T[] {
  return [...(items ?? [])].sort((x, y) => {
    const a = texto(x);
    const b = texto(y);
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });
}
