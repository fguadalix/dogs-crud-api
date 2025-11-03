# Troubleshooting Guide

## 🔧 Problemas Comunes y Soluciones

### 1. Error: "Cannot find module '@prisma/client'"

**Causa**: El cliente de Prisma no ha sido generado.

**Solución**:
```bash
npm run prisma:generate
```

### 2. Error de conexión a PostgreSQL

**Causa**: PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución**:
```bash
# Opción 1: Usar Docker Compose
docker-compose up -d

# Opción 2: Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Opción 3: Verificar las credenciales en .env
cat .env
# Asegúrate que DATABASE_URL es correcto
```

### 3. Error: "Migration failed"

**Causa**: La base de datos no existe o hay conflictos.

**Solución**:
```bash
# Crear la base de datos manualmente
psql -U postgres -c "CREATE DATABASE dogs_crud_db;"

# O usar el script de reset (⚠️ elimina datos)
npx prisma migrate reset
```

### 4. Tests fallan con error de conexión

**Causa**: Base de datos de test no está disponible.

**Solución**:
```bash
# Usar Docker Compose para la BD de test
docker-compose up -d postgres_test

# O crear manualmente
psql -U postgres -c "CREATE DATABASE dogs_crud_test;"

# Configurar .env.test correctamente
cat .env.test
```

### 5. Error: "Port 3000 already in use"

**Causa**: El puerto ya está siendo usado por otro proceso.

**Solución**:
```bash
# Encontrar el proceso
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O cambiar el puerto en .env
echo "PORT=3001" >> .env
```

### 6. TypeScript compilation errors

**Causa**: Tipos no están actualizados o hay errores de sintaxis.

**Solución**:
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Verificar errores
npm run build
```

### 7. Tests pasan localmente pero fallan en CI

**Causa**: Diferencias en el entorno o timing issues.

**Solución**:
```bash
# Ejecutar tests en modo CI localmente
npm run test:ci

# Verificar logs de GitHub Actions
# Asegurarse que las variables de entorno están configuradas
```

### 8. Error: "P2002: Unique constraint failed"

**Causa**: Intentando crear un registro con un valor único duplicado.

**Solución**:
```typescript
// Verificar si existe antes de crear
const existing = await prisma.item.findUnique({
  where: { name: itemName }
});

if (existing) {
  throw new AppError(409, 'Item already exists');
}
```

### 9. Error: "P2025: Record not found"

**Causa**: Intentando actualizar/eliminar un registro que no existe.

**Solución**:
```typescript
// Verificar si existe antes de operar
const item = await prisma.item.findUnique({
  where: { id }
});

if (!item) {
  throw new AppError(404, 'Item not found');
}
```

### 10. Prisma Studio no abre

**Causa**: Puerto ocupado o error de configuración.

**Solución**:
```bash
# Cerrar procesos anteriores
pkill -f "prisma studio"

# Abrir en puerto específico
npx prisma studio --port 5555
```

## 🐛 Debug Tips

### Ver queries SQL de Prisma

En desarrollo, las queries ya se muestran. Para producción:

```typescript
// src/infrastructure/database/prisma.ts
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### Debug de tests específicos

```bash
# Run solo un test
npm test -- -t "should create a new item"

# Run con más detalles
npm test -- --verbose

# Run sin coverage para más rapidez
npm test -- --no-coverage
```

### Verificar estado de migraciones

```bash
# Ver migraciones aplicadas
npx prisma migrate status

# Ver diferencias
npx prisma migrate diff
```

### Limpiar base de datos

```bash
# Reset completo (⚠️ elimina todos los datos)
npx prisma migrate reset

# O manualmente
npx prisma migrate reset --skip-seed
```

## 📊 Monitoring y Logs

### Ver logs de la aplicación

```bash
# En desarrollo
npm run dev

# En producción con PM2
pm2 logs dogs-crud-api
```

### Ver logs de PostgreSQL

```bash
# Ubuntu/Debian
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Docker
docker-compose logs -f postgres
```

## 🚀 Performance Issues

### Queries lentas

1. **Agregar índices**
```prisma
model Item {
  name String @unique
  
  @@index([createdAt])
  @@index([name, createdAt])
}
```

2. **Usar select en lugar de traer todo**
```typescript
await prisma.item.findMany({
  select: { id: true, name: true }
});
```

3. **Paginar resultados**
```typescript
await prisma.item.findMany({
  take: 10,
  skip: 0,
});
```

### Alto uso de memoria

1. **Limitar resultados**
2. **Usar streams para datos grandes**
3. **Cerrar conexiones de Prisma**
```typescript
await prisma.$disconnect();
```

## 🔒 Security Issues

### Variables de entorno expuestas

**Nunca commitear .env**
```bash
# Verificar
git status

# Si ya fue commiteado
git rm --cached .env
echo ".env" >> .gitignore
```

### SQL Injection

Prisma ya protege contra SQL injection, pero evita raw queries:
```typescript
// ❌ Peligroso
await prisma.$queryRaw`SELECT * FROM items WHERE name = ${userInput}`;

// ✅ Seguro
await prisma.item.findMany({
  where: { name: userInput }
});
```

## 📞 Obtener Ayuda

Si los problemas persisten:

1. **Verificar logs completos**
2. **Revisar documentación de Prisma**: https://www.prisma.io/docs
3. **Revisar GitHub Issues del proyecto**
4. **Stack Overflow con tag [prisma]**
5. **Prisma Discord Community**

## 🧪 Verificación de Salud del Sistema

Ejecuta este script para verificar que todo está bien:

```bash
#!/bin/bash

echo "🔍 System Health Check"
echo ""

# Check Node.js
echo "✓ Node.js: $(node --version)"

# Check npm
echo "✓ npm: $(npm --version)"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL: installed"
else
    echo "✗ PostgreSQL: not found"
fi

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    echo "✓ Dependencies: installed"
else
    echo "✗ Dependencies: not installed (run: npm install)"
fi

# Check if .env exists
if [ -f ".env" ]; then
    echo "✓ .env: configured"
else
    echo "✗ .env: missing (run: cp .env.example .env)"
fi

# Check if Prisma client is generated
if [ -d "node_modules/@prisma/client" ]; then
    echo "✓ Prisma Client: generated"
else
    echo "✗ Prisma Client: not generated (run: npm run prisma:generate)"
fi

echo ""
echo "Health check complete!"
```

Guarda esto como `health-check.sh` y ejecútalo:
```bash
chmod +x health-check.sh
./health-check.sh
```
