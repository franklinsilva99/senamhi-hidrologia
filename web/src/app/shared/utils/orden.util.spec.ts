import { describe, expect, it } from 'vitest';

import { compararTextos, ordenAlfabetico } from './orden.util';

describe('compararTextos', () => {
  it('ordena alfabéticamente cuando hay valor en ambos', () => {
    expect(compararTextos('a', 'b')).toBeLessThan(0);
    expect(compararTextos('b', 'a')).toBeGreaterThan(0);
    expect(compararTextos('a', 'a')).toBe(0);
  });

  it('deja al final los valores ausentes en vez de romperse', () => {
    // Antes, un nulo tiraba «Cannot read properties of null» y se caía la pantalla.
    expect(compararTextos(null, 'a')).toBeGreaterThan(0);
    expect(compararTextos('a', null)).toBeLessThan(0);
    expect(compararTextos(undefined, 'a')).toBeGreaterThan(0);
  });

  it('dos valores ausentes quedan igualados', () => {
    expect(compararTextos(null, null)).toBe(0);
    expect(compararTextos(undefined, null)).toBe(0);
  });

  it('ordena una lista con huecos sin perder elementos', () => {
    const lista = ['c', null, 'a', undefined, 'b'];

    expect([...lista].sort(compararTextos)).toEqual(['a', 'b', 'c', null, undefined]);
  });
});

describe('ordenAlfabetico', () => {
  it('ordena sin distinguir mayúsculas ni tildes y deja los vacíos al final', () => {
    const lista = [
      { n: 'Villa María' },
      { n: null },
      { n: 'ate' },
      { n: 'Ámbar' },
      { n: 'CAMPO DE MARTE' },
    ];
    expect(ordenAlfabetico(lista, (x) => x.n).map((x) => x.n)).toEqual([
      'Ámbar',
      'ate',
      'CAMPO DE MARTE',
      'Villa María',
      null,
    ]);
  });

  it('no modifica la lista original y tolera que no llegue', () => {
    const lista = ['b', 'a'];
    expect(ordenAlfabetico(lista, (x) => x)).toEqual(['a', 'b']);
    expect(lista).toEqual(['b', 'a']);
    expect(ordenAlfabetico(null, (x: string) => x)).toEqual([]);
  });
});
