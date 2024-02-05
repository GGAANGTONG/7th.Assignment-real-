/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Authentication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Authentication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Authentication` ADD COLUMN `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Authentication_userId_key` ON `Authentication`(`userId`);

-- AddForeignKey
ALTER TABLE `Authentication` ADD CONSTRAINT `Authentication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`UserId`) ON DELETE CASCADE ON UPDATE CASCADE;
