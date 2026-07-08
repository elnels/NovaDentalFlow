-- AlterTable
ALTER TABLE "clinical_history" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "procedure_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "default_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedure_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_line_items" (
    "id" TEXT NOT NULL,
    "clinical_history_id" TEXT NOT NULL,
    "procedure_catalog_id" TEXT NOT NULL,
    "tooth_id" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "procedure_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedure_catalog_code_key" ON "procedure_catalog"("code");

-- AddForeignKey
ALTER TABLE "procedure_line_items" ADD CONSTRAINT "procedure_line_items_clinical_history_id_fkey" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_line_items" ADD CONSTRAINT "procedure_line_items_procedure_catalog_id_fkey" FOREIGN KEY ("procedure_catalog_id") REFERENCES "procedure_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
