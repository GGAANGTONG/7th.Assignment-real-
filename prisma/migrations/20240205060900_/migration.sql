-- CreateTable
CREATE TABLE `Authentication` (
    `AuthId` INTEGER NOT NULL AUTO_INCREMENT,
    `GeneratedAuthNumber` INTEGER NOT NULL,

    UNIQUE INDEX `Authentication_GeneratedAuthNumber_key`(`GeneratedAuthNumber`),
    PRIMARY KEY (`AuthId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
