-- Migración: crear tabla items usada por el ejemplo CRUD
-- Ajusta tipos/constraints según necesites

CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
