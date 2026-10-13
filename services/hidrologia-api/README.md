# hidrologia-backend

Backend **Hidrología SENAMHI** — port del PoC (Next.js) a **Java (Spring Boot) + Postgres**.

Stack: Java 21 · Spring Boot 3.5 · Spring Data JPA · PostgreSQL 16 · Lombok.

## Requisitos

- JDK 21
- Maven 3.9+
- Docker (para Postgres) o un PostgreSQL local

## Cómo correr

```bash
# 1) Levantar Postgres
docker compose up -d

# 2) Compilar y arrancar (siembra los datos del PoC automáticamente en el primer arranque)
mvn spring-boot:run
```

La API queda en `http://localhost:8080/api`.

## Datos semilla

En el primer arranque (`DataSeeder`) se cargan los JSON del PoC desde
`src/main/resources/data/` (estaciones, series de nivel/caudal, configuración de
umbrales, avisos y pronóstico). No se re-siembra si ya hay estaciones en la BD.

## Contrato de API

Ver `C:\Users\Usuario\.opencode\plan\PLAN1.md` (sección 4).

Convenciones:

- Prefijo `/api`.
- Envoltorio de respuesta: `{ "status": true, "message": null, "trace": null, "data": ... }`.
- Listados paginados: `PaginatedResponseModel<T>` con `totalElements`, `totalPages`, `page`, `pageSize`.
- Fechas como string (`YYYY-MM-DD` para fechas y `YYYY-MM-DDTHH:mm` para horas), hora local Perú.

## Estructura (Clean Architecture)

```
pe.gob.senamhi.hidrologia
├── domain/
│   ├── model/        # entidades JPA + value objects + enums
│   ├── repository/   # puertos (interfaces Spring Data)
│   └── service/      # lógica de negocio pura (port de lib/domain del PoC)
├── web/              # adaptador HTTP: controllers + DTOs de respuesta
└── config/           # siembra de datos + manejo global de errores
```
