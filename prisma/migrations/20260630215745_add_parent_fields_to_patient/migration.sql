/*
  Warnings:

  - You are about to drop the column `nombre_madre` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `nombre_padre` on the `clinical_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clinical_history" DROP COLUMN "nombre_madre",
DROP COLUMN "nombre_padre";

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "nombre_madre" TEXT,
ADD COLUMN     "nombre_padre" TEXT,
ADD COLUMN     "telefono_madre" TEXT,
ADD COLUMN     "telefono_padre" TEXT;
