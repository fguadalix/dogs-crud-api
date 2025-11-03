# 📁 Estructura del Proyecto

```
dogs-crud-api/
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD
│
├── prisma/
│   ├── schema.prisma                 # Schema de Prisma (fuente de verdad)
│   └── .gitkeep
│
├── sql-migrations/
│   ├── V1__Create_base_schema.sql   # Migraciones SQL originales
│   ├── V2__create_items_table.sql
│   └── README.md
│
├── src/
│   ├── __tests__/                   # Tests
│   │   ├── setup.ts                 # Configuración global de tests
│   │   ├── integration/
│   │   │   └── api/
│   │   │       └── item.api.test.ts # Tests de API (E2E)
│   │   └── unit/
│   │       ├── commands/
│   │       │   └── item.command.test.ts
│   │       ├── queries/
│   │       │   └── item.query.test.ts
│   │       └── transactions/
│   │           └── transaction.test.ts
│   │
│   ├── application/                 # Capa de Aplicación (CQRS)
│   │   ├── commands/                # Commands (escritura)
│   │   │   └── items/
│   │   │       ├── create-item.command.ts
│   │   │       ├── update-item.command.ts
│   │   │       ├── delete-item.command.ts
│   │   │       ├── create-multiple-items.command.ts
│   │   │       └── index.ts
│   │   ├── queries/                 # Queries (lectura)
│   │   │   └── items/
│   │   │       ├── get-all-items.query.ts
│   │   │       ├── get-item-by-id.query.ts
│   │   │       └── index.ts
│   │   ├── common/                  # Clases base CQRS
│   │   │   ├── cqrs.ts
│   │   │   └── transaction.ts
│   │   └── dtos/                    # Data Transfer Objects
│   │       └── item.dto.ts
│   │
│   ├── infrastructure/              # Capa de Infraestructura
│   │   └── database/
│   │       └── prisma.ts            # Configuración de Prisma
│   │
│   ├── presentation/                # Capa de Presentación (HTTP)
│   │   ├── controllers/
│   │   │   └── item.controller.ts   # Controladores HTTP
│   │   ├── middleware/
│   │   │   └── error.middleware.ts  # Manejo de errores
│   │   ├── routes/
│   │   │   ├── index.ts             # Router principal
│   │   │   └── item.routes.ts       # Rutas de items
│   │   └── validators/
│   │       └── item.validator.ts    # Validación con Zod
│   │
│   ├── app.ts                       # Configuración de Express
│   └── index.ts                     # Entry point
│
├── .env                             # Variables de entorno (no commitear)
├── .env.example                     # Ejemplo de variables de entorno
├── .env.test                        # Variables para tests
├── .eslintrc.json                   # Configuración de ESLint
├── .gitignore                       # Archivos ignorados por Git
├── .prettierrc                      # Configuración de Prettier
├── api-examples.http                # Ejemplos de peticiones HTTP
├── docker-compose.yml               # Docker Compose para PostgreSQL
├── health-check.sh                  # Script de verificación
├── jest.config.js                   # Configuración de Jest
├── package.json                     # Dependencias y scripts
├── setup.sh                         # Script de instalación
├── test.sh                          # Script de tests
├── tsconfig.json                    # Configuración de TypeScript
├── DEVELOPMENT.md                   # Guía de desarrollo
├── QUICKSTART.md                    # Guía de inicio rápido
├── README.md                        # Documentación principal
└── TROUBLESHOOTING.md              # Guía de solución de problemas
```

## 📊 Estadísticas del Proyecto

- **Lenguaje**: TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Testing**: Jest + Supertest
- **Validación**: Zod
- **Base de Datos**: PostgreSQL
- **Patrón**: CQRS (Command Query Responsibility Segregation)
- **CI/CD**: GitHub Actions

## 🎯 Capas de la Arquitectura

### 1. Presentation Layer (`src/presentation/`)
- Controladores HTTP
- Rutas de Express
- Validación de entrada
- Middleware de errores

### 2. Application Layer (`src/application/`)
- Commands (operaciones de escritura)
- Queries (operaciones de lectura)
- DTOs (Data Transfer Objects)
- Lógica de negocio

### 3. Infrastructure Layer (`src/infrastructure/`)
- Configuración de base de datos
- Cliente de Prisma
- Servicios externos

## 🔄 Flujo de una Request

```
HTTP Request
    ↓
Express Router (presentation/routes/)
    ↓
Controller (presentation/controllers/)
    ↓
Validator (presentation/validators/)
    ↓
Command/Query (application/commands|queries/)
    ↓
Prisma Client (infrastructure/database/)
    ↓
PostgreSQL Database
    ↓
Response
```

## 📝 Convenciones de Código

### Naming Conventions
- **Commands**: `{Action}{Entity}Command` (ej: `CreateItemCommand`)
- **Queries**: `{Action}{Entity}Query` (ej: `GetAllItemsQuery`)
- **Controllers**: `{Entity}Controller` (ej: `ItemController`)
- **DTOs**: `{Entity}DTO` (ej: `ItemDTO`)
- **Tests**: `{filename}.test.ts` o `{filename}.spec.ts`

### Estructura de Archivos
- Un comando/query por archivo
- Exportar desde `index.ts` en cada carpeta
- Tests al lado del código o en `__tests__/`

### TypeScript
- Usar tipos estrictos
- Evitar `any` cuando sea posible
- Definir interfaces para contratos

## 🧪 Testing Strategy

### Unit Tests
- Tests de Commands individuales
- Tests de Queries individuales
- Tests de validaciones
- Tests de transacciones

### Integration Tests
- Tests de endpoints HTTP completos
- Tests de flujos de trabajo
- Tests con base de datos real

### Coverage Goals
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## 🚀 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con hot-reload |
| `npm run build` | Compilar a JavaScript |
| `npm start` | Iniciar en producción |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:ci` | Tests para CI |
| `npm run lint` | Lint con ESLint |
| `npm run format` | Formatear con Prettier |
| `npm run prisma:generate` | Generar Prisma Client |
| `npm run prisma:migrate` | Crear/aplicar migraciones |
| `npm run prisma:studio` | Abrir Prisma Studio |

## 📦 Dependencias Principales

### Production
- `@prisma/client` - Cliente de Prisma
- `express` - Framework web
- `dotenv` - Variables de entorno
- `zod` - Validación de esquemas

### Development
- `typescript` - TypeScript
- `jest` - Framework de testing
- `supertest` - Testing HTTP
- `prisma` - CLI de Prisma
- `ts-node-dev` - Dev server
- `eslint` - Linter
- `prettier` - Formateador

## 🔐 Variables de Entorno

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
PORT=3000
NODE_ENV=development|test|production
```

## 🌐 API Endpoints

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/items` | Obtener todos los items |
| GET | `/api/items/:id` | Obtener item por ID |
| POST | `/api/items` | Crear nuevo item |
| POST | `/api/items/batch` | Crear múltiples items |
| PUT | `/api/items/:id` | Actualizar item |
| DELETE | `/api/items/:id` | Eliminar item |

## 🎨 Patrones de Diseño Utilizados

1. **CQRS** - Separación de Commands y Queries
2. **Repository Pattern** - Prisma actúa como repository
3. **DTO Pattern** - Transfer de datos entre capas
4. **Dependency Injection** - A través de constructores
5. **Error Handling** - Centralizado con middleware
6. **Transaction Pattern** - Para operaciones atómicas

## 📚 Documentación

- **README.md**: Documentación general del proyecto
- **QUICKSTART.md**: Guía rápida de inicio
- **DEVELOPMENT.md**: Guía detallada de desarrollo
- **TROUBLESHOOTING.md**: Solución de problemas comunes
- **PROJECT_STRUCTURE.md**: Este archivo

## 🔄 Workflow de Desarrollo

1. Crear rama para feature
2. Implementar Command/Query
3. Agregar Controller y Route
4. Escribir tests
5. Verificar que pasen: `npm test`
6. Lint: `npm run lint`
7. Commit y push
8. Crear Pull Request
9. CI verifica tests y lint
10. Merge a main

## 🏗️ Extensibilidad

El proyecto está diseñado para ser fácilmente extensible:

- **Nuevas entidades**: Agregar nuevos Commands/Queries
- **Nuevas validaciones**: Agregar schemas de Zod
- **Nuevos endpoints**: Agregar routes y controllers
- **Nuevas funcionalidades**: Seguir patrón CQRS existente

## 🎓 Recursos de Aprendizaje

- [Prisma Docs](https://www.prisma.io/docs)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Express.js](https://expressjs.com/)
- [Jest Testing](https://jestjs.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod Validation](https://zod.dev/)
