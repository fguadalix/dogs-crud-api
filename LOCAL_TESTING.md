# 🐕 Dogs CRUD API - Guía de Testing Local

Script completo para facilitar las pruebas locales de la API con Node.js, TypeScript, PostgreSQL, Prisma y CQRS.

## 📋 Pre-requisitos

- **Docker** y **Docker Compose**
- **Node.js** (v20+)
- **npm**
- **curl** (para tests)
- **jq** (opcional, para formatear JSON)

## 🚀 Inicio Rápido

### 1. Configuración inicial (solo primera vez)

```bash
./test-local.sh setup
```

Esto ejecutará:
- ✅ Instalación de dependencias npm
- ✅ Inicio de contenedores Docker (PostgreSQL)
- ✅ Generación de Prisma Client
- ✅ Ejecución de migraciones de base de datos

### 2. Iniciar el servidor

```bash
./test-local.sh start
```

El servidor estará disponible en: **http://localhost:3000**

### 3. Probar la API

En otra terminal:

```bash
# Pruebas básicas CRUD
./test-local.sh test-api

# Pruebas de rate limiting
./test-local.sh test-rate

# Pruebas de transacciones batch
./test-local.sh test-batch
```

### 4. Detener todo

```bash
./test-local.sh stop
```

## 📚 Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `setup` | Configuración inicial completa (Docker + migraciones) |
| `start` | Iniciar servidor en modo desarrollo |
| `stop` | Detener servidor y contenedores Docker |
| `test` | Ejecutar todos los tests (72 tests, 96%+ coverage) |
| `test-api` | Probar operaciones CRUD básicas |
| `test-rate` | Probar rate limiters |
| `test-batch` | Probar creación transaccional de múltiples items |
| `clean` | Limpiar base de datos, contenedores y archivos |
| `studio` | Abrir Prisma Studio (visualizador de BD) |
| `help` | Mostrar ayuda completa |

## 🔍 Ejemplos de Uso

### Flujo completo de testing

```bash
# 1. Setup inicial (primera vez)
./test-local.sh setup

# 2. Iniciar servidor
./test-local.sh start

# 3. En otra terminal - probar CRUD
./test-local.sh test-api

# 4. Probar rate limiting
./test-local.sh test-rate

# 5. Probar transacciones
./test-local.sh test-batch

# 6. Ver base de datos (abre navegador)
./test-local.sh studio

# 7. Ejecutar tests automatizados
./test-local.sh test

# 8. Detener todo
./test-local.sh stop

# 9. Limpiar completamente (opcional)
./test-local.sh clean
```

### Pruebas manuales con curl

```bash
# Health check
curl http://localhost:3000/health

# Listar items
curl http://localhost:3000/api/items | jq .

# Crear item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Golden Retriever", "description": "Friendly dog"}'

# Actualizar item (reemplaza {id} con ID real)
curl -X PUT http://localhost:3000/api/items/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Eliminar item
curl -X DELETE http://localhost:3000/api/items/{id}

# Crear múltiples (transaccional)
curl -X POST http://localhost:3000/api/items/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"name": "Dog 1", "description": "First"},
      {"name": "Dog 2", "description": "Second"}
    ]
  }'
```

## 🌐 Endpoints de la API

| Método | Endpoint | Descripción | Rate Limit |
|--------|----------|-------------|------------|
| `GET` | `/health` | Health check | - |
| `GET` | `/api/items` | Listar todos los items | 100 req/min |
| `GET` | `/api/items/:id` | Obtener item por ID | 100 req/min |
| `POST` | `/api/items` | Crear nuevo item | 50 req/15min |
| `PUT` | `/api/items/:id` | Actualizar item | 50 req/15min |
| `DELETE` | `/api/items/:id` | Eliminar item | 50 req/15min |
| `POST` | `/api/items/batch` | Crear múltiples (transaccional) | 10 req/15min |

## 🛡️ Características de Seguridad

El proyecto incluye **21 tests de seguridad** que verifican:

- ✅ **SQL Injection Protection**: Prisma ORM protege contra inyección SQL
- ✅ **XSS Protection**: Los payloads se almacenan de forma segura
- ✅ **Path Traversal Protection**: Validación de parámetros de ruta
- ✅ **Command Injection Protection**: Entrada sanitizada
- ✅ **Rate Limiting**: Límites por tipo de operación
- ✅ **Input Validation**: Validación con Zod

## 🧪 Testing

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar tests específicos

```bash
# Tests de integración API
npm test -- src/__tests__/integration/api/

# Tests de seguridad
npm test -- src/__tests__/integration/security/

# Tests de rate limiting
npm test -- src/__tests__/integration/rate-limiting/

# Tests de concurrencia
npm test -- src/__tests__/integration/concurrency/

# Tests unitarios
npm test -- src/__tests__/unit/
```

### Coverage

```bash
npm test
# Coverage: 96.73%
# - Statements: 96.66%
# - Branches: 84.61%
# - Functions: 94.44%
# - Lines: 96.44%
```

## 🗄️ Base de Datos

### Acceso a PostgreSQL

```bash
# Desarrollo
Host: localhost
Port: 5435
User: dev_user
Password: dev_password
Database: dogs_crud_db

# Testing
Host: localhost
Port: 5434
User: test_user
Password: test_password
Database: dogs_crud_test
```

### Prisma Studio

Visualiza y edita la base de datos en el navegador:

```bash
./test-local.sh studio
# Abre http://localhost:5555
```

### Comandos Prisma útiles

```bash
# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos
npx prisma migrate reset

# Generar Prisma Client
npx prisma generate
```

## 📊 Arquitectura

```
src/
├── app.ts                          # Configuración Express
├── index.ts                        # Entry point
├── application/                    # Capa de aplicación (CQRS)
│   ├── commands/                   # Comandos (write operations)
│   │   └── items/
│   ├── queries/                    # Queries (read operations)
│   │   └── items/
│   ├── common/                     # CQRS base classes
│   └── dtos/                       # Data Transfer Objects
├── infrastructure/                 # Capa de infraestructura
│   └── database/
│       └── prisma.ts              # Prisma client
├── presentation/                   # Capa de presentación
│   ├── controllers/               # Controladores
│   ├── middleware/                # Middleware (errors, rate-limit)
│   ├── routes/                    # Rutas
│   ├── validators/                # Validación Zod
│   └── constants/                 # Constantes HTTP
└── __tests__/                     # Tests
    ├── integration/               # Tests de integración
    │   ├── api/
    │   ├── security/
    │   ├── rate-limiting/
    │   └── concurrency/
    └── unit/                      # Tests unitarios
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` (ya existe):

```env
# Development Database
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5435/dogs_crud_db?schema=public"

# Test Database
TEST_DATABASE_URL="postgresql://test_user:test_password@localhost:5434/dogs_crud_test?schema=public"

# Server
PORT=3000
NODE_ENV=development
```

## 📝 Notas

### Rate Limiting

Los límites están configurados por tipo de operación:
- **Lectura** (GET): 100 requests/minuto
- **Escritura** (POST/PUT/DELETE): 50 requests/15 minutos
- **Batch**: 10 requests/15 minutos

### Transacciones

Las operaciones batch (`/api/items/batch`) usan transacciones de Prisma:
- ✅ Si todos los items se crean correctamente, se commitea
- ✅ Si alguno falla (ej: nombre duplicado), se hace rollback completo

### CQRS Pattern

El proyecto implementa CQRS (Command Query Responsibility Segregation):
- **Commands**: Operaciones de escritura (Create, Update, Delete)
- **Queries**: Operaciones de lectura (Get, List)

## 🆘 Troubleshooting

### El servidor no inicia

```bash
# Verificar que Docker está corriendo
docker ps

# Reiniciar contenedores
docker-compose restart

# Ver logs
docker-compose logs
```

### Puerto 3000 ocupado

```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### Base de datos con problemas

```bash
# Resetear base de datos
./test-local.sh clean
./test-local.sh setup
```

### Tests fallan

```bash
# Limpiar y reinstalar
rm -rf node_modules
npm install

# Regenerar Prisma Client
npm run prisma:generate

# Ejecutar tests
npm test
```

## 📦 Stack Tecnológico

- **Runtime**: Node.js 20+
- **Lenguaje**: TypeScript 5.9+
- **Framework**: Express.js
- **Base de datos**: PostgreSQL 15
- **ORM**: Prisma 6.18.0
- **Testing**: Jest + Supertest
- **Validación**: Zod
- **Rate Limiting**: express-rate-limit
- **Patrón**: CQRS
- **Containerización**: Docker

## 📄 Licencia

MIT

---

**Desarrollado con ❤️ para demostración de buenas prácticas en APIs RESTful**
