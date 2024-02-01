/*
  Warnings:

  - The primary key for the `AccessToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `AccessToken` table. All the data in the column will be lost.
  - Added the required column `AccessTokenId` to the `AccessToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `AccessToken` DROP FOREIGN KEY `AccessToken_RefreshToken_fkey`;

-- DropForeignKey
ALTER TABLE `AccessToken` DROP FOREIGN KEY `AccessToken_userId_fkey`;

-- AlterTable
ALTER TABLE `AccessToken` DROP PRIMARY KEY,
    DROP COLUMN `userId`,
    ADD COLUMN `AccessTokenId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`AccessTokenId`);
