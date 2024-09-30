/*
  Warnings:

  - Added the required column `targetUserId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postSlug" TEXT,
ADD COLUMN     "postTitle" TEXT,
ADD COLUMN     "targetUserId" TEXT NOT NULL;
