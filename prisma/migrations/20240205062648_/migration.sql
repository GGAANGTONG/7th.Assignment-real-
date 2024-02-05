/*
  Warnings:

  - You are about to drop the column `GeneratedAuthNumber` on the `Authentication` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[generatedAuthNumber]` on the table `Authentication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `generatedAuthNumber` to the `Authentication` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Authentication_GeneratedAuthNumber_key` ON `Authentication`;

-- AlterTable
ALTER TABLE `Authentication` DROP COLUMN `GeneratedAuthNumber`,
    ADD COLUMN `generatedAuthNumber` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Authentication_generatedAuthNumber_key` ON `Authentication`(`generatedAuthNumber`);
