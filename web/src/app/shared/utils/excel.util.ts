import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/** Definición de una columna del reporte. */
export interface ExcelColumn {
  title: string;
  key: string;
  width?: number;
}

export class ExcelUtil {
  /**
   * Arma el libro del reporte y lo descarga.
   *
   * La construcción está en `buildWorkbook`, aparte de la descarga, para poder
   * verificar el contenido generado sin sustituir módulos.
   */
  static async exportExcel<T>(fileName: string, columns: ExcelColumn[], datos: T[]) {
    const workbook = ExcelUtil.buildWorkbook(fileName, columns, datos);
    const buffer = await workbook.xlsx.writeBuffer();
    ExcelUtil.descargar(new Blob([buffer]), `${fileName}.xlsx`);
  }

  /**
   * Entrega el archivo al navegador. Está aparte para que las pruebas puedan
   * observar qué se descarga sin depender de cómo la biblioteca resuelve la
   * descarga en cada entorno.
   */
  static descargar(contenido: Blob, nombreArchivo: string): void {
    saveAs(contenido, nombreArchivo);
  }

  /** Arma el libro del reporte, con encabezados, datos, anchos y filtros. */
  static buildWorkbook<T>(fileName: string, columns: ExcelColumn[], datos: T[]): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('REPORTE');

    // 1. Define Columns (Headers will be initially at Row 1)
    worksheet.columns = columns.map((x) => ({
      header: x.title.toUpperCase(),
      key: String(x.key),
      width: x.width || 20,
    }));

    // 2. Insert Rows at top for Organization, Title and Metadata
    // We insert 5 rows.
    // Row 1: Organization ("SENAMHI")
    // Row 2: Title
    // Row 3: Date
    // Row 4: User
    // Row 5: Empty/Spacer
    // Row 6: Actual Headers (moved down)
    worksheet.spliceRows(1, 0, [], [], [], [], []);

    // 3. Set Organization (Row 1)
    const orgRow = worksheet.getRow(1);
    orgRow.getCell(1).value = 'Servicio Nacional de Meteorología e Hidrología del Perú';
    worksheet.mergeCells(1, 1, 1, columns.length);
    orgRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    orgRow.getCell(1).font = {
      name: 'Arial',
      size: 18,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    orgRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002259' }, // Primary Color
    };
    orgRow.height = 35;

    // 4. Set Title (Row 2)
    const titleRow = worksheet.getRow(2);
    titleRow.getCell(1).value = fileName.toUpperCase().replaceAll('_', ' ');
    worksheet.mergeCells(2, 1, 2, columns.length);
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.getCell(1).font = {
      name: 'Arial',
      size: 14,
      bold: true,
      color: { argb: '000000' },
    };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfdc400' }, // Secondary Color
    };
    titleRow.height = 25;

    // 5. Set Metadata (Rows 3 & 4)
    const dateRow = worksheet.getRow(3);
    dateRow.getCell(1).value = `Fecha de consulta: ${new Date().toLocaleString()}`;
    dateRow.getCell(1).font = { bold: true };
    worksheet.mergeCells(3, 1, 3, 3);

    const userRow = worksheet.getRow(4);
    userRow.getCell(1).value = 'Usuario: SYSTEM';
    userRow.getCell(1).font = { bold: true };
    worksheet.mergeCells(4, 1, 4, 3);

    // 6. Style Header Row (Now at Row 6)
    const headerRow = worksheet.getRow(6);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF002259' }, // Primary Color
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // 7. Add Data
    datos.forEach((dato) => {
      worksheet.addRow(dato);
    });

    // 8. Auto-width columns (solo las que no declaran width: el explícito se respeta)
    worksheet.columns.forEach((column, colIndex) => {
      if (columns[colIndex]?.width) {
        return;
      }
      let maxLength = 0;
      // Check header length
      const headerCell = worksheet.getRow(6).getCell(colIndex + 1);
      if (headerCell.value) {
        maxLength = String(headerCell.value).length;
      }

      // Check data length (Row 7 onwards)
      const rowCount = worksheet.rowCount;
      for (let i = 7; i <= rowCount; i++) {
        const cell = worksheet.getRow(i).getCell(colIndex + 1);
        // Comparación con null para no descartar el 0 numérico.
        if (cell.value != null) {
          const len = String(cell.value).length;
          if (len > maxLength) {
            maxLength = len;
          }
        }
      }
      column.width = Math.min(maxLength + 5, 70);
    });

    // 9. Apply Borders to Data Rows
    const totalRows = worksheet.rowCount;
    const totalCols = columns.length;

    // Start from Row 7 (Data)
    for (let i = 7; i <= totalRows; i++) {
      const row = worksheet.getRow(i);
      for (let j = 1; j <= totalCols; j++) {
        const cell = row.getCell(j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      }
    }

    // 10. Auto Filter (for headers)
    // 10. Auto Filter (including data)
    worksheet.autoFilter = {
      from: { row: 6, column: 1 },
      to: { row: totalRows, column: totalCols },
    };

    // 11. Freeze Panes
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }];

    return workbook;
  }
}
