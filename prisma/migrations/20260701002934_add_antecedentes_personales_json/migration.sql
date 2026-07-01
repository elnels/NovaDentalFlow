/*
  Warnings:

  - The `antecedentes_personales` column on the `clinical_details` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "clinical_details" DROP COLUMN "antecedentes_personales",
ADD COLUMN     "antecedentes_personales" JSONB;
