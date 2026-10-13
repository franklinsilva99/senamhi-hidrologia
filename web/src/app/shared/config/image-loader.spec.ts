import { afterEach, describe, expect, it } from 'vitest';

import { customImageLoader } from './image-loader';

describe('customImageLoader', () => {
  afterEach(() => document.querySelectorAll('base').forEach((b) => b.remove()));

  const conBase = (href: string) => {
    const base = document.createElement('base');
    base.setAttribute('href', href);
    document.head.appendChild(base);
  };

  it('pide las imágenes bajo la ruta base de la página', () => {
    conBase('/qc-aire/');
    expect(customImageLoader({ src: 'images/logo.png' })).toBe('/qc-aire/assets/images/logo.png');
    expect(customImageLoader({ src: '/images/logo.png' })).toBe('/qc-aire/assets/images/logo.png');
  });

  it('agrega la barra final si la base no la trae', () => {
    conBase('/qc-aire');
    expect(customImageLoader({ src: 'logo.svg' })).toBe('/qc-aire/assets/logo.svg');
  });

  it('sin <base> en la página usa la ruta de la compilación', () => {
    expect(customImageLoader({ src: 'logo.svg' })).toBe('/assets/logo.svg');
  });
});
