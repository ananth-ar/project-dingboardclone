-- DropIndex
DROP INDEX "Post_authorId_idx";

-- Enable the pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX name_trigram_idx ON "User" USING gin (name gin_trgm_ops);

-- CreateIndex
CREATE INDEX title_trigram_idx ON "Post" USING gin (title gin_trgm_ops);

