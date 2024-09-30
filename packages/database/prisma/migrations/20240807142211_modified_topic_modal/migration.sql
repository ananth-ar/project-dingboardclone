/*
  Warnings:

  - You are about to drop the `_PostToTopic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_PostToTopic" DROP CONSTRAINT "_PostToTopic_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToTopic" DROP CONSTRAINT "_PostToTopic_B_fkey";

-- DropTable
DROP TABLE "_PostToTopic";

-- CreateTable
CREATE TABLE "PostTopics" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostTopics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostTopics_postId_idx" ON "PostTopics"("postId");

-- AddForeignKey
ALTER TABLE "PostTopics" ADD CONSTRAINT "PostTopics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTopics" ADD CONSTRAINT "PostTopics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
