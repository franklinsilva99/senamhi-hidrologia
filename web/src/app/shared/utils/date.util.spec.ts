import { describe, expect, it } from 'vitest';

import { DateUtil } from './date.util';

describe('DateUtil.convertDateToUTC', () => {
  it('devuelve la fecha en formato YYYY-MM-DD según UTC', () => {
    expect(DateUtil.convertDateToUTC(new Date('2026-08-31T15:30:45Z'))).toBe('2026-08-31');
  });

  it('rellena mes y día con ceros a la izquierda', () => {
    expect(DateUtil.convertDateToUTC(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
  });

  it('usa el día UTC aunque la fecha local corresponda al día anterior', () => {
    // 23:00 en UTC-5 (Perú) ya es la 04:00 del día siguiente en UTC.
    expect(DateUtil.convertDateToUTC(new Date('2025-12-31T23:00:00-05:00'))).toBe('2026-01-01');
  });

  it('descarta la hora por completo', () => {
    expect(DateUtil.convertDateToUTC(new Date('2026-02-28T23:59:59.999Z'))).toBe('2026-02-28');
  });
});
