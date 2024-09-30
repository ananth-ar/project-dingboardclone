-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToTopic" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_topic_key" ON "Topic"("topic");

-- CreateIndex
CREATE INDEX "topic_trigram_idx" ON "Topic"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTopic_AB_unique" ON "_PostToTopic"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToTopic_B_index" ON "_PostToTopic"("B");

-- AddForeignKey
ALTER TABLE "_PostToTopic" ADD CONSTRAINT "_PostToTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTopic" ADD CONSTRAINT "_PostToTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
