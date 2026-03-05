/*
  Warnings:

  - You are about to drop the column `cetegory` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `category` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Activity_plz_status_cetegory_createdAt_idx";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "cetegory",
ADD COLUMN     "category" "ActivityCategory" NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_plz_status_category_createdAt_idx" ON "Activity"("plz", "status", "category", "createdAt");
