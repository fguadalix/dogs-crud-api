# Testing Documentation

Este documento describe la estrategia de testing implementada en el proyecto dogs-crud-api.

## Resumen de Cobertura

- **Total de Tests**: 41
- **Cobertura de Código**: 99.37%
- **Test Suites**: 5
- **Estado**: ✅ Todos los tests pasando

## Estructura de Tests

```
src/__tests__/
├── setup.ts                              # Configuración global de tests
├── unit/                                  # Tests unitarios (18 tests)
│   ├── commands/
│   │   └── item.command.test.ts          # 9 tests
│   ├── queries/
│   │   └── item.query.test.ts            # 6 tests
│   └── transactions/
│       └── transaction.test.ts           # 3 tests
└── integration/                          # Tests de integración (25 tests)
    ├── api/
    │   └── item.api.test.ts              # 16 tests
    └── concurrency/
        └── transaction-concurrency.test.ts # 9 tests
```

## 1. Tests Unitarios de Comandos (9 tests)

**Ubicación**: `src/__tests__/unit/commands/item.command.test.ts`

### CreateItemCommand
- ✅ Debe crear un nuevo item con todos los campos
- ✅ Debe crear un item sin descripción (opcional)
- ✅ Debe fallar al crear un item con nombre duplicado

### UpdateItemCommand
- ✅ Debe actualizar un item existente
- ✅ Debe fallar al actualizar un item que no existe

### DeleteItemCommand
- ✅ Debe eliminar un item existente
- ✅ Debe fallar al eliminar un item que no existe

### CreateMultipleItemsCommand (Transaccional)
- ✅ Debe crear múltiples items en una transacción
- ✅ Debe hacer rollback si algún item falla (atomicidad)

**Propósito**: Validar la lógica de negocio aislada de Commands (patrón CQRS).

---

## 2. Tests Unitarios de Queries (6 tests)

**Ubicación**: `src/__tests__/unit/queries/item.query.test.ts`

### GetAllItemsQuery
- ✅ Debe retornar array vacío cuando no hay items
- ✅ Debe retornar todos los items ordenados por createdAt DESC
- ✅ Debe ordenar items correctamente por fecha de creación

### GetItemByIdQuery
- ✅ Debe retornar un item cuando existe
- ✅ Debe retornar null cuando el item no existe
- ✅ Debe manejar IDs inválidos correctamente

**Propósito**: Validar la lógica de consultas aislada (patrón CQRS).

---

## 3. Tests Unitarios de Transacciones (3 tests)

**Ubicación**: `src/__tests__/unit/transactions/transaction.test.ts`

### TransactionManager
- ✅ Debe ejecutar múltiples operaciones en una transacción
- ✅ Debe hacer rollback si una operación falla
- ✅ Debe ejecutar una sola operación en una transacción

**Propósito**: Validar que el TransactionManager proporciona atomicidad ACID.

---

## 4. Tests de Integración API (16 tests)

**Ubicación**: `src/__tests__/integration/api/item.api.test.ts`

### GET /api/items
- ✅ Debe retornar array vacío cuando no hay items
- ✅ Debe retornar todos los items

### GET /api/items/:id
- ✅ Debe retornar item por ID
- ✅ Debe retornar 404 cuando el item no existe
- ✅ Debe retornar 500 para formato de ID inválido

### POST /api/items
- ✅ Debe crear un nuevo item
- ✅ Debe crear item sin descripción
- ✅ Debe fallar con nombre duplicado (409 Conflict)
- ✅ Debe fallar con datos inválidos (500)

### PUT /api/items/:id
- ✅ Debe actualizar un item
- ✅ Debe retornar 404 al actualizar item inexistente

### DELETE /api/items/:id
- ✅ Debe eliminar un item
- ✅ Debe retornar 404 al eliminar item inexistente

### POST /api/items/batch (Transaccional)
- ✅ Debe crear múltiples items en una transacción
- ✅ Debe hacer rollback de todos los items si uno falla

### GET /health
- ✅ Debe retornar estado de salud del servicio

**Propósito**: Validar la API REST completa end-to-end con HTTP requests reales.

---

## 5. Tests de Concurrencia Transaccional (9 tests)

**Ubicación**: `src/__tests__/integration/concurrency/transaction-concurrency.test.ts`

### Actualizaciones Concurrentes - Optimistic Concurrency

#### ✅ Should handle concurrent updates to the same item
- **Escenario**: Dos usuarios actualizan el mismo item simultáneamente
- **Comportamiento**: Ambas operaciones completan (last write wins)
- **Validación**: El estado final refleja una de las dos actualizaciones

#### ✅ Should handle concurrent reads while updating
- **Escenario**: Múltiples lecturas mientras se actualiza un item
- **Comportamiento**: Todas las operaciones completan exitosamente
- **Validación**: Las lecturas retornan estado consistente (antes o después de update)

### Creaciones Concurrentes - Race Conditions

#### ✅ Should prevent duplicate names when creating concurrently
- **Escenario**: 5 intentos simultáneos de crear item con mismo nombre
- **Comportamiento**: Solo 1 creación exitosa (201), 4 fallan con conflicto (409)
- **Validación**: Solo 1 registro en base de datos
- **Demuestra**: Constraint de unicidad funcionando bajo concurrencia

#### ✅ Should handle concurrent batch creates with overlapping data
- **Escenario**: Dos batch operations con un item compartido
- **Comportamiento**: Un batch completa exitosamente, el otro hace rollback completo
- **Validación**: No hay inserciones parciales (atomicidad transaccional)

### Eliminaciones Concurrentes

#### ✅ Should handle concurrent deletes of the same item
- **Escenario**: 3 usuarios intentan eliminar el mismo item simultáneamente
- **Comportamiento**: 1 delete exitoso (204), 2 fallan con 404
- **Validación**: El item ya no existe en la base de datos

### Escenarios de Conflicto Lectura-Escritura

#### ✅ Should handle read-modify-write pattern correctly
- **Escenario**: 10 operaciones concurrentes de read-modify-write (contador)
- **Comportamiento**: Algunas actualizaciones se pierden (lost updates)
- **Validación**: Valor final < 10 (demuestra el problema de lost updates)
- **Propósito Educativo**: Muestra por qué se necesita locking optimista/pesimista

**Ejemplo de salida**:
```
Lost update test: Expected 10, got 1 (9 updates lost)
```

#### ✅ Should handle concurrent update and delete
- **Escenario**: Un usuario actualiza mientras otro elimina el mismo item
- **Comportamiento**: Ambas operaciones pueden completar dependiendo del timing
- **Validación**: Estado final consistente (item actualizado O eliminado)

### Aislamiento Transaccional - Batch Operations

#### ✅ Should ensure atomicity in concurrent batch operations
- **Escenario**: Dos batch creates concurrentes con item compartido ("Shared-Item")
- **Comportamiento**: 
  - Un batch completa exitosamente (3 items creados)
  - El otro batch falla completamente (0 items creados por rollback)
- **Validación**: 
  - No hay inserciones parciales
  - El item compartido existe solo una vez
  - Total de items nuevos = 2 (del batch exitoso, excluyendo el compartido)

### Prevención de Deadlocks

#### ✅ Should handle potential deadlock situations gracefully
- **Escenario**: Dos transacciones actualizando items en orden inverso
  - Transacción 1: Update Item1 → Update Item2
  - Transacción 2: Update Item2 → Update Item1
- **Comportamiento**: PostgreSQL detecta y resuelve el deadlock automáticamente
- **Validación**: Todas las operaciones completan sin errores
- **Demuestra**: Capacidad del motor de base de datos para manejar deadlocks

**Propósito**: Demostrar comportamiento del sistema bajo condiciones de concurrencia real.

---

## Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Solo tests unitarios
```bash
npm test -- --testPathPattern=unit
```

### Solo tests de integración
```bash
npm test -- --testPathPattern=integration
```

### Solo tests de concurrencia
```bash
npm test -- --testPathPattern=concurrency
```

### Tests específicos
```bash
npm test -- --testPathPattern=item.command
```

### Con cobertura
```bash
npm test -- --coverage
```

### Modo watch
```bash
npm test -- --watch
```

---

## Configuración de Tests

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/index.ts'],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  runInBand: true,
};
```

### Setup Global (`src/__tests__/setup.ts`)
- Limpia la base de datos antes de cada test
- Usa la base de datos de test configurada en `.env.test`
- Garantiza aislamiento entre tests

---

## Variables de Entorno para Tests

### `.env.test`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/test_db"
NODE_ENV=test
PORT=3001
```

### Docker Compose
- **Base de datos de desarrollo**: Puerto 5435
- **Base de datos de test**: Puerto 5434

---

## Cobertura por Módulo

| Módulo | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **app.ts** | 100% | 100% | 100% | 100% |
| **Commands** | 100% | 100% | 100% | 100% |
| **Queries** | 100% | 100% | 100% | 100% |
| **Controllers** | 100% | 100% | 100% | 100% |
| **Routes** | 100% | 100% | 100% | 100% |
| **Validators** | 100% | 100% | 100% | 100% |
| **Middleware** | 100% | 100% | 100% | 100% |
| **Transaction Manager** | 88.88% | 100% | 66.66% | 88.88% |
| **Database/Prisma** | 100% | 50% | 100% | 100% |
| **TOTAL** | **99.37%** | **91.66%** | **97.05%** | **99.33%** |

---

## Patrones de Testing Implementados

### 1. **Arrange-Act-Assert (AAA)**
Todos los tests siguen este patrón:
```typescript
it('should create a new item', async () => {
  // Arrange
  const itemData = { name: 'Test Item', description: 'Test' };
  
  // Act
  const command = new CreateItemCommand(itemData);
  const result = await command.execute();
  
  // Assert
  expect(result.name).toBe('Test Item');
});
```

### 2. **Test Isolation**
- Cada test limpia la base de datos antes de ejecutarse
- No hay dependencias entre tests
- Orden de ejecución no importa

### 3. **Test Fixtures**
```typescript
// Setup común reutilizable
beforeEach(async () => {
  await prisma.item.deleteMany();
});
```

### 4. **Integration Testing con Supertest**
```typescript
const response = await request(app)
  .post('/api/items')
  .send({ name: 'New Item' });

expect(response.status).toBe(201);
```

### 5. **Concurrency Testing con Promise.all**
```typescript
const [response1, response2] = await Promise.all([
  request(app).put(`/api/items/${id}`).send(update1),
  request(app).put(`/api/items/${id}`).send(update2),
]);
```

---

## Casos de Uso Demostrados

### ✅ CRUD Básico
- Crear, leer, actualizar, eliminar items

### ✅ Validación de Datos
- Zod schemas validando inputs
- Manejo de errores 400/500

### ✅ Constraints de Base de Datos
- Unicidad de nombres
- Manejo de duplicados (409 Conflict)

### ✅ Transacciones ACID
- Atomicidad en batch operations
- Rollback automático en fallos

### ✅ Manejo de Concurrencia
- Race conditions
- Lost updates
- Optimistic concurrency
- Deadlock prevention

### ✅ Patrón CQRS
- Separación Commands/Queries
- Tests independientes para cada lado

### ✅ Error Handling
- Errores 404 (Not Found)
- Errores 409 (Conflict)
- Errores 500 (Internal Server Error)

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow
Los tests se ejecutan automáticamente en:
- ✅ Push a `main`
- ✅ Push a `develop`
- ✅ Pull Requests

### Pipeline de CI
1. **Setup**: Node.js 20, PostgreSQL 15
2. **Install**: Dependencias npm
3. **Migrate**: Prisma migrations
4. **Lint**: ESLint
5. **Build**: TypeScript compilation
6. **Test**: Jest con cobertura
7. **Coverage Report**: Artifact upload

---

## Mejores Prácticas Implementadas

### ✅ Tests Legibles
- Nombres descriptivos en español e inglés
- Estructura clara AAA
- Comentarios explicativos en tests complejos

### ✅ Tests Rápidos
- `runInBand: true` para tests de base de datos
- Cleanup eficiente con `deleteMany`
- Tests paralelos donde es posible

### ✅ Tests Confiables
- Sin flaky tests
- Sin dependencias de timing (excepto tests de concurrencia intencionales)
- Seeds determinísticos

### ✅ Tests Mantenibles
- DRY (Don't Repeat Yourself)
- Helpers reutilizables
- Fixtures compartidos

### ✅ Coverage Significativo
- 99.37% de cobertura real
- No solo líneas, también branches y functions
- Tests de casos edge

---

## Próximos Pasos (Opcional)

### Tests Adicionales Sugeridos
- [ ] Tests de performance/load testing
- [ ] Tests de seguridad (SQL injection, XSS)
- [ ] Tests de autenticación/autorización
- [ ] Tests de paginación y filtrado
- [ ] Tests de Users y Roles (otras entidades del schema)
- [ ] Tests de OrderItems (relaciones)
- [ ] Tests de rate limiting
- [ ] Tests de caching

### Herramientas Adicionales
- [ ] Artillery o k6 para load testing
- [ ] Mutation testing con Stryker
- [ ] Contract testing con Pact
- [ ] E2E testing con Playwright

---

## Troubleshooting

### Tests fallan con error de conexión a DB
```bash
# Verificar que Docker está corriendo
docker compose ps

# Iniciar base de datos de test
docker compose up -d postgres_test

# Aplicar migraciones
npx prisma migrate deploy
```

### Tests lentos
```bash
# Verificar que runInBand está habilitado en jest.config.js
# Esto previene race conditions en DB

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Coverage no alcanza threshold
```bash
# Ver reporte detallado
npm test -- --coverage --verbose

# Ver en navegador
open coverage/lcov-report/index.html
```

---

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última actualización**: 3 de noviembre de 2025
**Versión del proyecto**: 1.0.0
**Mantenedor**: @fguadalix
