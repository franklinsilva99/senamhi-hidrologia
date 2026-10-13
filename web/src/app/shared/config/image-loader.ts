import { ImageLoaderConfig } from '@angular/common';
import { environment } from '../../../environments/environment';

/**
 * Las imágenes se piden bajo la ruta base real de la página (`<base href>`).
 *
 * La aplicación puede publicarse bajo una ruta distinta de '/', que se fija en
 * el `<base href>` al arrancar: con la ruta de la compilación ('/') el logo y
 * las demás imágenes se pedían a la raíz del dominio. Sin `<base>` en la página
 * se usa la de la compilación.
 */
export function customImageLoader(config: ImageLoaderConfig): string {
  const src = config.src.startsWith('/') ? config.src.slice(1) : config.src;

  const base =
    globalThis.document?.querySelector('base')?.getAttribute('href') || environment.baseHref;
  const baseHref = base.endsWith('/') ? base : base + '/';

  return `${baseHref}assets/${src}`;
}
