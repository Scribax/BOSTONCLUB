-- AlterTable: Add pointsPerPeso to ClubSettings
ALTER TABLE "ClubSettings" ADD COLUMN IF NOT EXISTS "pointsPerPeso" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
