# SQL Migrations

Esta carpeta contiene las migraciones SQL originales del proyecto.

## 📝 Nota Importante

Este proyecto usa **Prisma Migrate** para gestionar las migraciones de la base de datos. Los archivos SQL aquí son solo de referencia, ya que el schema de Prisma (`prisma/schema.prisma`) es la fuente de verdad.

## Archivos

- `V1__Create_base_schema.sql` - Schema base con users, roles, items, order_items
- `V2__create_items_table.sql` - Tabla items (ya incluida en V1)

## Cómo usar estos archivos con Prisma

### Opción 1: Usar Prisma Migrate (Recomendado)

El proyecto ya tiene un `schema.prisma` que refleja estas tablas. Solo ejecuta:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Opción 2: Aplicar SQL manualmente (No recomendado)

Si necesitas aplicar estos archivos SQL directamente:

```bash
# Conectarse a PostgreSQL
psql -U user -d dogs_crud_db

# Ejecutar los archivos
\i sql-migrations/V1__Create_base_schema.sql
\i sql-migrations/V2__create_items_table.sql
```

Luego sincroniza Prisma:

```bash
npx prisma db pull
npx prisma generate
```

## Estructura de la Base de Datos

### Tablas Principales

1. **roles** - Roles de usuario (ADMIN, USER)
2. **users** - Usuarios del sistema
3. **user_roles** - Relación usuarios-roles (many-to-many)
4. **items** - Items del CRUD
5. **order_items** - Items de órdenes

### Triggers

- `update_users_timestamp` - Actualiza `updated_at` automáticamente
- `update_items_timestamp` - Actualiza `updated_at` automáticamente
- `update_order_items_timestamp` - Actualiza `updated_at` automáticamente

## Flujo Recomendado

1. **Desarrollo**: Usa Prisma Migrate
```bash
# Modificar prisma/schema.prisma
# Crear migración
npm run prisma:migrate
```

2. **Producción**: Usa deploy
```bash
npm run prisma:migrate:deploy
```

3. **Verificación**: Usa Prisma Studio
```bash
npm run prisma:studio
```

## Ver Migraciones de Prisma

```bash
# Ver estado
npx prisma migrate status

# Ver SQL generado
cat prisma/migrations/*/migration.sql
```
