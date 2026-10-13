# hidrologia-web

Frontend **Angular** del Sistema de Monitoreo Hidrológico SENAMHI.

Stack: Angular 21 · PrimeNG · Leaflet · ECharts/Chart.js · zoneless (sin zone.js).

## Desarrollo

```bash
npm install
npm start        # ng serve → http://localhost:4200
npm run build    # ng build
npm test         # ng test (Vitest)
```

El proxy de desarrollo (`proxy.conf.json`) reenvía `/api` a `http://localhost:8080`
(el backend en `services/hidrologia-api`).

## Estructura

```
src/app/
├── core/       # infraestructura (interceptors, servicios transversales)
├── features/   # pantallas por módulo (private/public)
└── shared/     # componentes/directivas/servicios reutilizables
```
