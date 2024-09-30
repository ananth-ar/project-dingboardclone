/*
  Warnings:

  - You are about to drop the column `isRead` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `newFollowUserId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userPostCommentUserId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userPostLikeUserId` on the `Notification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_newFollowUserId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userPostCommentUserId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userPostLikeUserId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "isRead",
DROP COLUMN "newFollowUserId",
DROP COLUMN "userPostCommentUserId",
DROP COLUMN "userPostLikeUserId",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "newFollowusername" TEXT,
ADD COLUMN     "userPostCommentusername" TEXT,
ADD COLUMN     "userPostLikeusername" TEXT,
ADD COLUMN     "userReplyusername" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_newFollowusername_fkey" FOREIGN KEY ("newFollowusername") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userPostCommentusername_fkey" FOREIGN KEY ("userPostCommentusername") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userPostLikeusername_fkey" FOREIGN KEY ("userPostLikeusername") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
