-- DropIndex
DROP INDEX "title_trigram_idx";

-- DropIndex
DROP INDEX "name_trigram_idx";

-- CreateIndex
CREATE INDEX "title_trigram_idx" ON "Post"("title");

-- CreateIndex
CREATE INDEX "name_trigram_idx" ON "User"("name");
