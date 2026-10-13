export const environment = {
  production: false,
  // Ruta relativa → pasa por el proxy del dev-server (proxy.conf.json) hacia
  // http://localhost:8080, evitando CORS.
  apiUrl: '/api',
  baseHref: '/',
};
