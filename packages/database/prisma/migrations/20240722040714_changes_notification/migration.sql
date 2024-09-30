/*
  Warnings:

  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `CommentNotificationsid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `FollowNotificationsid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `LikeNotificationsid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `PostLikesid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `commentid` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_CommentNotificationsid_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_FollowNotificationsid_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_LikeNotificationsid_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_PostLikesid_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_commentid_fkey";

-- DropIndex
DROP INDEX "Notification_userId_key";

-- DropIndex
DROP INDEX "User_commentid_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "userId",
ADD COLUMN     "newFollowUserId" TEXT,
ADD COLUMN     "userPostCommentUserId" TEXT,
ADD COLUMN     "userPostLikeUserId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "CommentNotificationsid",
DROP COLUMN "FollowNotificationsid",
DROP COLUMN "LikeNotificationsid",
DROP COLUMN "PostLikesid",
DROP COLUMN "commentid";

-- CreateTable
CREATE TABLE "_PostLikes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PostLikes_AB_unique" ON "_PostLikes"("A", "B");

-- CreateIndex
CREATE INDEX "_PostLikes_B_index" ON "_PostLikes"("B");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_newFollowUserId_fkey" FOREIGN KEY ("newFollowUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userPostCommentUserId_fkey" FOREIGN KEY ("userPostCommentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userPostLikeUserId_fkey" FOREIGN KEY ("userPostLikeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostLikes" ADD CONSTRAINT "_PostLikes_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostLikes" ADD CONSTRAINT "_PostLikes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
