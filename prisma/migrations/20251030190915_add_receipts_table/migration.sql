-- Disable foreign key checks
SET session_replication_role = 'replica';

-- 1. First, add the new columns as nullable
ALTER TABLE "receipts" 
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "patientId" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PAGADO',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- 2. Update existing data
-- Set default status for existing records
UPDATE "receipts" SET "status" = 'PAGADO' WHERE "status" IS NULL;

-- Copy data from old columns to new ones if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'patientUserId') THEN
    UPDATE "receipts" SET "patientId" = "patientUserId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'createdBy') THEN
    UPDATE "receipts" SET "createdById" = "createdBy";
  END IF;
  
  -- Ensure updatedAt has a value
  UPDATE "receipts" SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) WHERE "updatedAt" IS NULL;
END $$;

-- 3. Make columns required
ALTER TABLE "receipts" 
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "concept" DROP NOT NULL;

-- 4. Drop old columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'patientUserId') THEN
    ALTER TABLE "receipts" DROP COLUMN "patientUserId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receipts' AND column_name = 'createdBy') THEN
    ALTER TABLE "receipts" DROP COLUMN "createdBy";
  END IF;
END $$;

-- 5. Drop old index if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'receipts_patientUserId_idx') THEN
    DROP INDEX "public"."receipts_patientUserId_idx";
  END IF;
END $$;

-- 6. Create new indexes
CREATE INDEX IF NOT EXISTS "receipts_patientId_idx" ON "receipts"("patientId");

-- 7. Add foreign key constraints with DEFERRABLE to handle any data issues
ALTER TABLE "receipts" 
  ADD CONSTRAINT "receipts_patientId_fkey" 
  FOREIGN KEY ("patientId") 
  REFERENCES "users"("userId") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "receipts" 
  ADD CONSTRAINT "receipts_doctorId_fkey" 
  FOREIGN KEY ("doctorId") 
  REFERENCES "users"("userId") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "receipts" 
  ADD CONSTRAINT "receipts_createdById_fkey" 
  FOREIGN KEY ("createdById") 
  REFERENCES "users"("userId") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
