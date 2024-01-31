-- CreateTable
CREATE TABLE `RefreshToken` (
    `userId` INTEGER NOT NULL,
    `RefreshToken` VARCHAR(191) NOT NULL,
    `Ip` VARCHAR(191) NOT NULL,
    `UserAgent` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
