/*
  Warnings:

  - You are about to drop the column `when` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `ActivityImage` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ActivityImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "when",
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ActivityImage" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
