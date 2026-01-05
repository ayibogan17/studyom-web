ALTER TABLE "Studio" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Studio_slug_key" ON "Studio"("slug");
