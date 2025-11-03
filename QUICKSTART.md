# 🚀 Quick Start Guide

## 📋 Pre-requisitos

- Node.js 18+
- PostgreSQL 13+ (o Docker)
- npm

## ⚡ Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL

# 3. Iniciar PostgreSQL (con Docker)
docker-compose up -d

# 4. Generar Prisma Client y ejecutar migraciones
npm run prisma:generate
npm run prisma:migrate

# 5. Iniciar servidor
npm run dev
```

El servidor estará disponible en: http://localhost:3000

## 🧪 Ejecutar Tests

```bash
# Tests completos
npm test

# Tests en modo watch
npm run test:watch
```

## 📡 Probar la API

### Opción 1: Con curl

```bash
# Health check
curl http://localhost:3000/health

# Crear item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Golden Retriever","description":"Friendly dog"}'

# Obtener todos los items
curl http://localhost:3000/api/items

# Obtener item por ID
curl http://localhost:3000/api/items/1

# Actualizar item
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Golden Retriever Updated"}'

# Eliminar item
curl -X DELETE http://localhost:3000/api/items/1

# Crear múltiples items (transaccional)
curl -X POST http://localhost:3000/api/items/batch \
  -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Beagle"},{"name":"Poodle"}]}'
```

### Opción 2: Con el archivo HTTP

Abre `api-examples.http` en VS Code con la extensión REST Client.

### Opción 3: Con Postman

Importa esta colección o usa las rutas:
- Base URL: `http://localhost:3000`
- Endpoints: Ver README.md

## 🗄️ Gestión de Base de Datos

```bash
# Ver base de datos en UI
npm run prisma:studio

# Crear nueva migración
npm run prisma:migrate

# Ver estado de migraciones
npx prisma migrate status

# Reset de base de datos (⚠️ elimina datos)
npx prisma migrate reset
```

## 📚 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor con hot-reload
npm run build            # Compilar TypeScript
npm start                # Servidor en producción

# Tests
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:ci          # Tests para CI

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run format           # Formatear con Prettier

# Prisma
npm run prisma:generate  # Generar cliente
npm run prisma:migrate   # Crear/aplicar migraciones
npm run prisma:studio    # Abrir Prisma Studio

# Scripts de ayuda
./setup.sh               # Setup automático
./test.sh                # Ejecutar todos los tests
./health-check.sh        # Verificar salud del sistema
```

## 🐳 Usar Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

## 🔧 Troubleshooting

Si encuentras problemas, consulta `TROUBLESHOOTING.md` o ejecuta:

```bash
./health-check.sh
```

## 📖 Documentación

- `README.md` - Documentación completa
- `DEVELOPMENT.md` - Guía de desarrollo
- `TROUBLESHOOTING.md` - Solución de problemas
- `api-examples.http` - Ejemplos de uso de la API

## 🎯 Próximos Pasos

1. **Explorar el código**: Comienza por `src/index.ts`
2. **Revisar tests**: Ve a `src/__tests__/`
3. **Probar API**: Usa `api-examples.http`
4. **Leer arquitectura**: Consulta `DEVELOPMENT.md`
5. **Agregar features**: Sigue los patrones CQRS existentes

## 🌟 Características Principales

✅ **CRUD Completo** - Create, Read, Update, Delete  
✅ **CQRS Pattern** - Commands y Queries separados  
✅ **Transacciones** - Operaciones atómicas  
✅ **Validación** - Datos validados con Zod  
✅ **Tests** - 70%+ cobertura  
✅ **CI/CD** - GitHub Actions configurado  
✅ **TypeScript** - Tipado estático  
✅ **Prisma** - ORM moderno  

## 💡 Tips

- Usa Prisma Studio para visualizar datos: `npm run prisma:studio`
- Los errores son capturados automáticamente
- Todas las operaciones de escritura usan Commands
- Todas las operaciones de lectura usan Queries
- Las transacciones aseguran consistencia de datos

## 🤝 Contribuir

1. Crea una rama para tu feature
2. Escribe tests para tu código
3. Asegúrate que los tests pasen: `npm test`
4. Verifica el linting: `npm run lint`
5. Haz commit y push

---

**¿Necesitas ayuda?** Consulta la documentación completa en README.md
