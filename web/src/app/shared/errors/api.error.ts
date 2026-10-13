export class ApiError extends Error {
  static readonly ERROR_MESSAGE_NOT_INTERNET: string =
    'No se pudo conectar al servidor. Verifica tu conexión a internet.';
  static readonly ERROR_MESSAGE_UNEXPECTED: string =
    'Se encontró un error inesperado. Vuelva a intentarlo más tarde.';
  static readonly ERROR_MESSAGE_404: string = 'No se encontró el recurso solicitado.';
  static readonly ERROR_MESSAGE_401: string = 'Las credenciales proporcionadas son incorrectas.';
  static readonly ERROR_MESSAGE_TOKEN_EXPIRED: string =
    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';

  public readonly trace?: string;
  public readonly isKnow: boolean;

  constructor(isKnow: boolean, message: string, trace?: string) {
    super(message);
    this.isKnow = isKnow;
    this.trace = trace;
  }
}
