/*
  Warnings:

  - A unique constraint covering the columns `[RefreshToken]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `AccessToken` (
    `userId` INTEGER NOT NULL,
    `AccessToken` VARCHAR(191) NOT NULL,
    `Reacquired` BOOLEAN NOT NULL,
    `CurrentToken` BOOLEAN NOT NULL,
    `RefreshToken` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `RefreshToken_RefreshToken_key` ON `RefreshToken`(`RefreshToken`);

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`UserId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD CONSTRAINT `AccessToken_RefreshToken_fkey` FOREIGN KEY (`RefreshToken`) REFERENCES `RefreshToken`(`RefreshToken`) ON DELETE CASCADE ON UPDATE CASCADE;
