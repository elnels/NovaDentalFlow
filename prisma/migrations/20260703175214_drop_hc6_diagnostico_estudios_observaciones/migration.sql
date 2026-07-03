/*
  Warnings:

  - You are about to drop the column `observaciones_hc6` on the `clinical_details` table. All the data in the column will be lost.
  - You are about to drop the column `diagnostico_presuncion` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `estudios_auxiliares` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `clinical_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clinical_details" DROP COLUMN "observaciones_hc6";

-- AlterTable
ALTER TABLE "clinical_history" DROP COLUMN "diagnostico_presuncion",
DROP COLUMN "estudios_auxiliares",
DROP COLUMN "observaciones";
