/*
  Warnings:

  - Added the required column `UserId` to the `AccessToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `AccessToken_RefreshToken_fkey` ON `AccessToken`;

-- AlterTable
ALTER TABLE `AccessToken` ADD COLUMN `UserId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_UserId_fkey` FOREIGN KEY (`UserId`) REFERENCES `Users`(`UserId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_RefreshToken_fkey` FOREIGN KEY (`RefreshToken`) REFERENCES `RefreshToken`(`RefreshToken`) ON DELETE CASCADE ON UPDATE CASCADE;
