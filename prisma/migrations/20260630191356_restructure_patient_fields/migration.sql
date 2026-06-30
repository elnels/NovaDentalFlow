/*
  Warnings:

  - You are about to drop the column `escolaridad` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `estado_civil` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `ocupacion` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `clinical_history` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `patients` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clinical_history" DROP COLUMN "escolaridad",
DROP COLUMN "estado_civil",
DROP COLUMN "ocupacion",
DROP COLUMN "sexo";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "genero",
ADD COLUMN     "escolaridad" TEXT,
ADD COLUMN     "estado_civil" TEXT,
ADD COLUMN     "ocupacion" TEXT,
ADD COLUMN     "sexo" TEXT;
