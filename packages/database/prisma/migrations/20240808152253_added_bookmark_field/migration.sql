-- CreateTable
CREATE TABLE "_UserBookmarks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserBookmarks_AB_unique" ON "_UserBookmarks"("A", "B");

-- CreateIndex
CREATE INDEX "_UserBookmarks_B_index" ON "_UserBookmarks"("B");

-- AddForeignKey
ALTER TABLE "_UserBookmarks" ADD CONSTRAINT "_UserBookmarks_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBookmarks" ADD CONSTRAINT "_UserBookmarks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
