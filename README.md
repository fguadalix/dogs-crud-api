# Dogs CRUD API

API REST con Node.js, TypeScript, PostgreSQL, Prisma y patrón CQRS.

## 🚀 Características

- ✅ **TypeScript** - Tipado estático para mayor seguridad
- ✅ **PostgreSQL** - Base de datos relacional robusta
- ✅ **Prisma** - ORM moderno con migraciones
- ✅ **CQRS Pattern** - Separación de Commands y Queries
- ✅ **Transacciones** - Operaciones atómicas con Prisma
- ✅ **Tests Completos** - Tests unitarios e integración con Jest
- ✅ **CI/CD** - GitHub Actions para tests automáticos
- ✅ **Express** - Framework web minimalista
- ✅ **Validación** - Validación de datos con Zod

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 13+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio** (si aplica)
```bash
cd /home/ubuntu/dogs-crud-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dogs_crud_db?schema=public"
PORT=3000
NODE_ENV=development
```

4. **Generar cliente de Prisma**
```bash
npm run prisma:generate
```

5. **Ejecutar migraciones**

Para aplicar las migraciones existentes en los archivos SQL:
```bash
# Primero, crea una migración inicial desde el schema
npm run prisma:migrate
```

## 🎯 Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm run build
npm start
```

### Prisma Studio (UI para la BD)
```bash
npm run prisma:studio
```

## 🧪 Tests

### Ejecutar todos los tests
```bash
npm test
```

### Tests en modo watch
```bash
npm run test:watch
```

### Tests para CI
```bash
npm run test:ci
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Items CRUD

#### Obtener todos los items
```
GET /api/items
```

#### Obtener un item por ID
```
GET /api/items/:id
```

#### Crear un item
```
POST /api/items
Content-Type: application/json

{
  "name": "Item Name",
  "description": "Item Description" // opcional
}
```

#### Actualizar un item
```
PUT /api/items/:id
Content-Type: application/json

{
  "name": "New Name", // opcional
  "description": "New Description" // opcional
}
```

#### Eliminar un item
```
DELETE /api/items/:id
```

#### Crear múltiples items (Transaccional)
```
POST /api/items/batch
Content-Type: application/json

{
  "items": [
    { "name": "Item 1", "description": "Desc 1" },
    { "name": "Item 2", "description": "Desc 2" }
  ]
}
```

## 🏗️ Arquitectura

El proyecto sigue el patrón CQRS (Command Query Responsibility Segregation):

```
src/
├── application/
│   ├── commands/        # Operaciones de escritura (Create, Update, Delete)
│   ├── queries/         # Operaciones de lectura (Get)
│   ├── common/          # CQRS base classes y transaction manager
│   └── dtos/            # Data Transfer Objects
├── infrastructure/
│   └── database/        # Configuración de Prisma
├── presentation/
│   ├── controllers/     # Controladores HTTP
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middleware de Express
│   └── validators/      # Validación con Zod
├── __tests__/
│   ├── unit/           # Tests unitarios
│   └── integration/    # Tests de integración
├── app.ts              # Configuración de Express
└── index.ts            # Entry point
```

## 🔄 Patrón CQRS

### Commands (Escritura)
- `CreateItemCommand` - Crear un item
- `UpdateItemCommand` - Actualizar un item
- `DeleteItemCommand` - Eliminar un item
- `CreateMultipleItemsCommand` - Crear múltiples items (transaccional)

### Queries (Lectura)
- `GetAllItemsQuery` - Obtener todos los items
- `GetItemByIdQuery` - Obtener un item por ID

## 💾 Transacciones

El proyecto incluye soporte completo para transacciones con Prisma:

```typescript
// Ejemplo: crear múltiples items en una transacción
const command = new CreateMultipleItemsCommand([
  { name: 'Item 1' },
  { name: 'Item 2' }
]);
const result = await command.execute(); // Todo o nada
```

## 🗄️ Base de Datos

El schema incluye:
- `users` - Usuarios del sistema
- `roles` - Roles de usuario
- `user_roles` - Relación usuarios-roles
- `items` - Items del CRUD
- `order_items` - Items de órdenes

## 🧪 Cobertura de Tests

Los tests incluyen:
- ✅ Tests unitarios de Commands
- ✅ Tests unitarios de Queries  
- ✅ Tests de transacciones
- ✅ Tests de integración de API
- ✅ Tests de validación
- ✅ Tests de casos de error

Objetivo de cobertura: **70%**

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia servidor en modo desarrollo
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Inicia servidor en producción
- `npm test` - Ejecuta tests con cobertura
- `npm run test:watch` - Tests en modo watch
- `npm run test:ci` - Tests para CI/CD
- `npm run lint` - Ejecuta ESLint
- `npm run format` - Formatea código con Prettier
- `npm run prisma:generate` - Genera cliente de Prisma
- `npm run prisma:migrate` - Ejecuta migraciones en desarrollo
- `npm run prisma:migrate:deploy` - Ejecuta migraciones en producción
- `npm run prisma:studio` - Abre Prisma Studio

## 🚀 CI/CD

El proyecto incluye configuración de GitHub Actions que:
1. Ejecuta tests en PostgreSQL containerizado
2. Valida el linting del código
3. Compila la aplicación
4. Genera reporte de cobertura

## 📝 Licencia

MIT

## 👤 Autor

Tu nombre aquí
