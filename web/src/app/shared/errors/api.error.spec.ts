import { describe, it, expect } from 'vitest';

import { ApiError } from './api.error';

describe('ApiError', () => {
  it('conserva message, isKnow y trace recibidos en el constructor', () => {
    const error = new ApiError(true, 'El registro ya existe', 'stack-del-backend');

    expect(error.message).toBe('El registro ya existe');
    expect(error.isKnow).toBe(true);
    expect(error.trace).toBe('stack-del-backend');
  });

  it('deja trace en undefined cuando no se envía', () => {
    const error = new ApiError(false, 'Fallo inesperado');

    expect(error.trace).toBeUndefined();
    expect(error.isKnow).toBe(false);
  });

  it('es una instancia de Error para que instanceof funcione en los catch', () => {
    const error = new ApiError(false, 'x');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it('expone los mensajes estáticos usados por el manejo de errores', () => {
    expect(ApiError.ERROR_MESSAGE_NOT_INTERNET).toContain('conexión a internet');
    expect(ApiError.ERROR_MESSAGE_UNEXPECTED).toContain('error inesperado');
    expect(ApiError.ERROR_MESSAGE_404).toContain('No se encontró');
    expect(ApiError.ERROR_MESSAGE_401).toContain('credenciales');
    expect(ApiError.ERROR_MESSAGE_TOKEN_EXPIRED).toContain('sesión ha expirado');
  });
});
