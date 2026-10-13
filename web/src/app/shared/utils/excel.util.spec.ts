import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Workbook, Worksheet } from 'exceljs';

import { ExcelUtil } from './excel.util';

/**
 * Las pruebas no sustituyen módulos.
 *
 * Antes se usaba `vi.mock('exceljs')` para capturar el libro generado, pero el
 * sistema de pruebas de Angular envuelve `vi.mock`, y al llamarlo así el
 * corredor no siempre puede deducir qué archivo lo invocó: el archivo entero
 * fallaba de forma intermitente con «Cannot read properties of undefined
 * (reading 'trim')», perdiendo sus diez pruebas (22/09/2026). Ahora se verifica
 * el libro que devuelve `buildWorkbook`, y la descarga se observa desde el
 * documento, sin sustituir nada.
 */
const COLUMNAS = [
  { title: 'Estación', key: 'estacion', width: 30 },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Valor', key: 'valor', width: 10 },
];

const DATOS = [
  { estacion: 'Ate', fecha: '2026-08-10', valor: 12.5 },
  { estacion: 'San Juan de Lurigancho', fecha: '2026-08-11', valor: 7 },
];

/** Devuelve la hoja REPORTE del libro generado. */
function hojaDe(workbook: Workbook): Worksheet {
  const hoja = workbook.getWorksheet('REPORTE');
  expect(hoja).toBeDefined();
  return hoja as Worksheet;
}

/** Arma el reporte y devuelve su hoja, que es lo que miran casi todas las pruebas. */
function hojaGenerada(
  fileName = 'reporte',
  columnas: { title: string; key: string; width?: number }[] = COLUMNAS,
  datos: unknown[] = DATOS,
): Worksheet {
  return hojaDe(ExcelUtil.buildWorkbook(fileName, columnas, datos));
}

describe('ExcelUtil.exportExcel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('genera una única hoja REPORTE y descarga el archivo como <nombre>.xlsx', async () => {
    const descargar = vi.spyOn(ExcelUtil, 'descargar').mockImplementation(() => undefined);

    await ExcelUtil.exportExcel('reporte_mensual', COLUMNAS, DATOS);

    expect(descargar).toHaveBeenCalledTimes(1);
    const [contenido, nombre] = descargar.mock.calls[0];
    expect(contenido).toBeInstanceOf(Blob);
    expect((contenido as Blob).size).toBeGreaterThan(0);
    expect(nombre).toBe('reporte_mensual.xlsx');
  });

  it('el libro tiene una única hoja, llamada REPORTE', () => {
    const workbook = ExcelUtil.buildWorkbook('reporte_mensual', COLUMNAS, DATOS);

    expect(workbook.worksheets.map((w) => w.name)).toEqual(['REPORTE']);
  });

  it('escribe organización, título y metadatos en las filas 1 a 5', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('15/08/2026, 10:30:00');

    const hoja = hojaGenerada('reporte_de_datos_horarios');

    expect(hoja.getRow(1).getCell(1).value).toBe(
      'Servicio Nacional de Meteorología e Hidrología del Perú',
    );
    // El título deriva del nombre de archivo: mayúsculas y guiones bajos → espacios.
    expect(hoja.getRow(2).getCell(1).value).toBe('REPORTE DE DATOS HORARIOS');
    expect(hoja.getRow(3).getCell(1).value).toBe('Fecha de consulta: 15/08/2026, 10:30:00');
    expect(hoja.getRow(4).getCell(1).value).toBe('Usuario: SYSTEM');
    // La fila 5 queda como separador vacío.
    expect(hoja.getRow(5).getCell(1).value ?? null).toBeNull();
  });

  it('coloca los encabezados en mayúsculas en la fila 6 con estilo corporativo', () => {
    const hoja = hojaGenerada();

    const fila = hoja.getRow(6);
    expect([1, 2, 3].map((i) => fila.getCell(i).value)).toEqual(['ESTACIÓN', 'FECHA', 'VALOR']);

    for (const i of [1, 2, 3]) {
      const celda = fila.getCell(i);
      expect(celda.fill).toMatchObject({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF002259' },
      });
      expect(celda.font).toMatchObject({ bold: true, color: { argb: 'FFFFFF' } });
      expect(celda.alignment).toMatchObject({ horizontal: 'center', wrapText: true });
      expect(celda.border?.top?.style).toBe('thin');
    }
  });

  it('vuelca los datos desde la fila 7 mapeando cada clave a su columna', () => {
    const hoja = hojaGenerada();

    expect(hoja.rowCount).toBe(8);
    expect([1, 2, 3].map((i) => hoja.getRow(7).getCell(i).value)).toEqual([
      'Ate',
      '2026-08-10',
      12.5,
    ]);
    expect(hoja.getRow(8).getCell(1).value).toBe('San Juan de Lurigancho');

    // Toda celda de datos lleva borde fino y ajuste de texto.
    for (const numeroFila of [7, 8]) {
      for (const columna of [1, 2, 3]) {
        const celda = hoja.getRow(numeroFila).getCell(columna);
        expect(celda.border?.top?.style, `fila ${numeroFila} col ${columna}`).toBe('thin');
        expect(celda.alignment?.wrapText, `fila ${numeroFila} col ${columna}`).toBe(true);
      }
    }
  });

  it('combina las celdas de organización y título a lo ancho de todas las columnas', () => {
    const hoja = hojaGenerada();

    expect(hoja.getCell('C1').isMerged).toBe(true);
    expect(hoja.getCell('C1').master.address).toBe('A1');
    expect(hoja.getCell('C2').isMerged).toBe(true);
    expect(hoja.getCell('C2').master.address).toBe('A2');
    // Los metadatos (filas 3 y 4) se combinan fijo en las columnas A-C.
    expect(hoja.getCell('C3').master.address).toBe('A3');
    expect(hoja.getCell('C4').master.address).toBe('A4');
  });

  it('respeta el width declarado y autoajusta solo las columnas sin width (contenido + 5, tope 70)', () => {
    const columnas = [
      { title: 'Estación', key: 'estacion', width: 30 },
      { title: 'Descripción', key: 'descripcion' },
      { title: 'Valor', key: 'valor', width: 8 },
      { title: 'Estación', key: 'estacionAuto' },
    ];
    const datos = [
      { estacion: 'Ate', descripcion: 'x'.repeat(80), valor: 12.5, estacionAuto: 'Ate' },
      {
        estacion: 'San Juan de Lurigancho',
        descripcion: 'corta',
        valor: 7,
        estacionAuto: 'San Juan de Lurigancho',
      },
    ];

    const hoja = hojaGenerada('reporte', columnas, datos);

    // El width declarado manda aunque el contenido pida otro ancho (27 o 10).
    expect(hoja.getColumn(1).width).toBe(30);
    expect(hoja.getColumn(3).width).toBe(8);
    // Sin width: el contenido de 80 caracteres queda topado en 70.
    expect(hoja.getColumn(2).width).toBe(70);
    // Sin width: 'San Juan de Lurigancho' (22) domina sobre el encabezado (8): 22 + 5.
    expect(hoja.getColumn(4).width).toBe(27);
  });

  it('ignora los valores vacíos al calcular el ancho de columna', () => {
    const columnas = [
      { title: 'Estación', key: 'estacion' },
      { title: 'Fecha', key: 'fecha' },
      { title: 'Valor', key: 'valor' },
    ];
    const datos = [{ estacion: 'Ate', fecha: null, valor: undefined }];

    const hoja = hojaGenerada('reporte', columnas, datos);

    // Sin datos en la columna, manda el encabezado 'FECHA' / 'VALOR' (5) + 5.
    expect(hoja.getColumn(2).width).toBe(10);
    expect(hoja.getColumn(3).width).toBe(10);
  });

  it('cuenta el 0 numérico como contenido al calcular el ancho de columna', () => {
    // Con encabezado vacío el único contenido de la columna es el 0: si se
    // descartara por ser falsy, el ancho quedaría en 0 + 5 en vez de 1 + 5.
    const columnas = [
      { title: '', key: 'cero' },
      { title: 'Fecha', key: 'fecha' },
    ];
    const datos = [{ cero: 0, fecha: '2026-08-10' }];

    const hoja = hojaGenerada('reporte', columnas, datos);

    expect(hoja.getRow(7).getCell(1).value).toBe(0);
    expect(hoja.getColumn(1).width).toBe(6);
  });

  it('configura el autofiltro desde la fila 6 hasta el final y congela las seis primeras filas', () => {
    const hoja = hojaGenerada();

    expect(hoja.autoFilter).toEqual({ from: { row: 6, column: 1 }, to: { row: 8, column: 3 } });
    expect(hoja.views).toEqual([{ state: 'frozen', xSplit: 0, ySplit: 6 }]);
  });

  it('sin datos deja solo los encabezados: 6 filas y filtro acotado a la fila 6', () => {
    const hoja = hojaGenerada('reporte', COLUMNAS, []);

    expect(hoja.rowCount).toBe(6);
    expect(hoja.autoFilter).toEqual({ from: { row: 6, column: 1 }, to: { row: 6, column: 3 } });
    // La columna con width declarado lo conserva; en la que no lo tiene solo
    // cuenta el encabezado 'FECHA' (5) + 5.
    expect(hoja.getColumn(1).width).toBe(30);
    expect(hoja.getColumn(2).width).toBe(10);
  });
});
