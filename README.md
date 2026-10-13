# senamhi-hidrologia

Sistema de monitoreo hidrológico SENAMHI (Sede Contingencia Junín).

Monorepo:

| Carpeta | Contenido |
|---|---|
| `services/hidrologia-api/` | Backend **Spring Boot 3 + PostgreSQL** (Clean Architecture) |
| `web/` | Frontend **Angular** (Fase 2, pendiente) |
| `docs/` | Contrato de API y documentación |
| `docker-compose.yml` | PostgreSQL (y servicios futuros) |

## Requisitos

- JDK 21
- Maven 3.9+
- Docker (o PostgreSQL 16 nativo)

## Desarrollo

```bash
# 1) Postgres
docker compose up -d

# 2) Backend
cd services/hidrologia-api
mvn spring-boot:run   # http://localhost:8080/api
```

El backend siembra los datos del PoC automáticamente en el primer arranque.

## Contrato de API

Ver [`docs/contrato-api.md`](docs/contrato-api.md).
