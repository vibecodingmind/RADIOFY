-- PostgreSQL: rename enum variant (safe when AZAMPAY exists).
-- Run: psql "$DATABASE_URL" -f scripts/migrate-azampay-to-pesapal.sql
-- Or: npx prisma db execute --file scripts/migrate-azampay-to-pesapal.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PaymentGatewayType' AND e.enumlabel = 'AZAMPAY'
  ) THEN
    ALTER TYPE "PaymentGatewayType" RENAME VALUE 'AZAMPAY' TO 'PESAPAL';
  END IF;
END $$;
