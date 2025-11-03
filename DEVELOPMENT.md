# Guía de Desarrollo

## 🏗️ Arquitectura y Patrones

### Patrón CQRS (Command Query Responsibility Segregation)

Este proyecto implementa CQRS para separar claramente las operaciones de lectura y escritura:

#### Commands (Escritura)
Los commands son responsables de modificar el estado de la aplicación:
- Crean, actualizan o eliminan datos
- Pueden ser transaccionales
- Retornan el resultado de la operación

```typescript
// Ejemplo de uso de un Command
const command = new CreateItemCommand({
  name: 'New Item',
  description: 'Description'
});
const result = await command.execute();
```

#### Queries (Lectura)
Los queries solo leen datos sin modificarlos:
- No modifican el estado
- Son idempotentes
- Optimizados para lectura

```typescript
// Ejemplo de uso de un Query
const query = new GetAllItemsQuery();
const items = await query.execute();
```

### Transacciones

El `TransactionManager` permite ejecutar múltiples operaciones de forma atómica:

```typescript
import { TransactionManager } from './application/common/transaction';

// Opción 1: Múltiples operaciones
const operations = [
  (tx) => tx.item.create({ data: { name: 'Item 1' } }),
  (tx) => tx.item.create({ data: { name: 'Item 2' } }),
];
const results = await TransactionManager.execute(operations);

// Opción 2: Una sola operación
const result = await TransactionManager.executeSingle(async (tx) => {
  const item = await tx.item.create({ data: { name: 'Item' } });
  await tx.orderItem.create({ 
    data: { orderId: 1, itemId: item.id, quantity: 1 } 
  });
  return item;
});
```

### Validación con Zod

Todos los endpoints validan los datos de entrada usando Zod:

```typescript
// src/presentation/validators/item.validator.ts
export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

// Uso en el controlador
const data = createItemSchema.parse(req.body);
```

### Manejo de Errores

El proyecto utiliza un sistema centralizado de manejo de errores:

```typescript
// Errores personalizados
throw new AppError(404, 'Item not found');

// Son capturados por el errorHandler middleware
// que retorna respuestas consistentes
```

## 🧪 Testing

### Estructura de Tests

```
src/__tests__/
├── setup.ts                    # Configuración global de tests
├── unit/
│   ├── commands/              # Tests de Commands
│   ├── queries/               # Tests de Queries
│   └── transactions/          # Tests de transacciones
└── integration/
    └── api/                   # Tests de endpoints HTTP
```

### Escribir Tests

#### Test Unitario de Command
```typescript
describe('CreateItemCommand', () => {
  it('should create a new item', async () => {
    const command = new CreateItemCommand({
      name: 'Test Item',
      description: 'Test Description',
    });

    const result = await command.execute();

    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test Item');
  });
});
```

#### Test de Integración de API
```typescript
describe('POST /api/items', () => {
  it('should create a new item', async () => {
    const response = await request(app)
      .post('/api/items')
      .send({ name: 'New Item' });

    expect(response.status).toBe(201);
    expect(response.body.data.item.name).toBe('New Item');
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- item.command.test.ts

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm test -- --coverage
```

## 🗄️ Prisma y Migraciones

### Flujo de Trabajo con Migraciones

1. **Modificar el schema**
```prisma
// prisma/schema.prisma
model NewModel {
  id   Int    @id @default(autoincrement())
  name String
}
```

2. **Crear migración**
```bash
npm run prisma:migrate
# Nombre: add_new_model
```

3. **Generar cliente**
```bash
npm run prisma:generate
```

### Comandos Útiles de Prisma

```bash
# Ver base de datos en UI
npm run prisma:studio

# Aplicar migraciones en producción
npm run prisma:migrate:deploy

# Reset de base de datos (⚠️ elimina datos)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

## 🔧 Agregar Nuevas Funcionalidades

### 1. Agregar un nuevo Command

```typescript
// src/application/commands/items/my-command.command.ts
import { Command } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';

export class MyCommand extends Command<ResultType> {
  constructor(private readonly data: InputType) {
    super();
  }

  async execute(): Promise<ResultType> {
    // Implementación
    return await prisma.item.someOperation(this.data);
  }
}
```

### 2. Agregar un nuevo Query

```typescript
// src/application/queries/items/my-query.query.ts
import { Query } from '../../common/cqrs';
import prisma from '../../../infrastructure/database/prisma';

export class MyQuery extends Query<ResultType> {
  async execute(): Promise<ResultType> {
    return await prisma.item.findMany();
  }
}
```

### 3. Agregar un nuevo Endpoint

```typescript
// src/presentation/controllers/item.controller.ts
static myEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const data = mySchema.parse(req.body);
  const command = new MyCommand(data);
  const result = await command.execute();
  
  res.status(200).json({
    status: 'success',
    data: { result },
  });
});

// src/presentation/routes/item.routes.ts
router.post('/my-endpoint', ItemController.myEndpoint);
```

### 4. Agregar Tests

```typescript
// src/__tests__/unit/commands/my-command.test.ts
describe('MyCommand', () => {
  it('should execute correctly', async () => {
    const command = new MyCommand(testData);
    const result = await command.execute();
    expect(result).toBeDefined();
  });
});
```

## 🐛 Debugging

### Debug en VS Code

Crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/index.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Logs de Prisma

En desarrollo, Prisma ya está configurado para mostrar queries:

```typescript
// src/infrastructure/database/prisma.ts
log: process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] 
  : ['error']
```

## 📦 Deployment

### Variables de Entorno en Producción

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
PORT=3000
NODE_ENV=production
```

### Build y Deploy

```bash
# 1. Instalar dependencias
npm ci

# 2. Generar Prisma Client
npm run prisma:generate

# 3. Ejecutar migraciones
npm run prisma:migrate:deploy

# 4. Build
npm run build

# 5. Start
npm start
```

## 🔐 Mejores Prácticas

### 1. Siempre usar Commands para escritura
❌ No hagas esto:
```typescript
await prisma.item.create({ data });
```

✅ Haz esto:
```typescript
const command = new CreateItemCommand(data);
await command.execute();
```

### 2. Siempre usar Queries para lectura
❌ No hagas esto:
```typescript
await prisma.item.findMany();
```

✅ Haz esto:
```typescript
const query = new GetAllItemsQuery();
await query.execute();
```

### 3. Usa transacciones para operaciones múltiples
```typescript
// Cuando necesites crear/actualizar múltiples registros relacionados
const command = new CreateMultipleItemsCommand(items);
await command.execute();
```

### 4. Valida siempre los datos de entrada
```typescript
const data = createItemSchema.parse(req.body);
```

### 5. Usa asyncHandler para los controladores
```typescript
static myEndpoint = asyncHandler(async (req, res) => {
  // El asyncHandler captura errores automáticamente
});
```

## 🚀 Performance Tips

1. **Indexar columnas frecuentemente consultadas**
```prisma
model Item {
  id   Int    @id @default(autoincrement())
  name String @unique // Ya tiene índice
  
  @@index([createdAt]) // Agregar índice
}
```

2. **Usar select para traer solo campos necesarios**
```typescript
await prisma.item.findMany({
  select: { id: true, name: true }
});
```

3. **Usar include solo cuando sea necesario**
```typescript
// Solo si necesitas las relaciones
await prisma.item.findMany({
  include: { orderItems: true }
});
```

## 📚 Recursos Adicionales

- [Prisma Documentation](https://www.prisma.io/docs)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Zod Documentation](https://zod.dev/)
