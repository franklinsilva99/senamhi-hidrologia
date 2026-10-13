# Contrato de API — Hidrología

Base URL: `{host}/api`. Envoltorio: `{ "status": true, "message": null, "trace": null, "data": ... }`.
Listados paginados: `{ ..., "data": [], "totalElements": N, "totalPages": N, "page": N, "pageSize": N }`.

## Estaciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stations` | Lista (filtro `?codigo=`) |
| GET | `/api/stations/{id}` | Detalle |
| PUT | `/api/stations/{id}` | Actualizar ficha (preferencia, tipo, cota, modoPublicacion, estado) |

## Observaciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stations/{id}/observations?hours=72` | Serie fusionada (nivel + caudal) |
| GET | `/api/stations/{id}/observations/latest` | Última lectura |
| GET | `/api/observations/latest` | Última lectura de todas (mapa) |
| GET | `/api/stations/{id}/caudal/diario` | Caudal promedio diario |
| POST | `/api/stations/{id}/observations` | Ingesta (`{fecha, variable, valor}`) |

## Detección

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/detection` | Clasifica último dato contra umbrales (solo lectura) |

## Avisos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/alerts` | Lista |
| GET | `/api/alerts/{ca}` | Detalle |
| POST | `/api/alerts/run-detection` | Orquestador crear/reemplazar/mantener |
| POST | `/api/alerts` | Publicación manual (`{stationId}`) |
| PUT | `/api/alerts/{ca}` | Habilitar/deshabilitar, validar DZ (`{vigente, validadoDZ}`) |

## Pronóstico

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/forecast/inputs?stationId=&fecha=` | Modelos cargados |
| POST | `/api/forecast/inputs` | Cargar modelo |
| DELETE | `/api/forecast/inputs/{id}` | Quitar modelo |
| GET | `/api/forecast/diario?stationId=` | Pronóstico promedio D+1..D+3 |

## Configuración (umbrales + vigencia)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/config-records?stationId=&variable=` | Tabla de configuración |
| GET | `/api/config-records/vigente?stationId=&variable=&fecha=` | Registro vigente |
| POST | `/api/config-records` | Crear (cierra el anterior) |
| PUT | `/api/config-records/{id}` | Editar |
| DELETE | `/api/config-records/{id}` | Eliminar |

## Centros poblados

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/centros-poblados` | Lista |
| POST | `/api/centros-poblados` | Crear |
| PUT | `/api/centros-poblados/{id}` | Editar |
| DELETE | `/api/centros-poblados/{id}` | Eliminar |
