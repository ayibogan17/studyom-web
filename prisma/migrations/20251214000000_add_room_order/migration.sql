-- Add order column for room ordering
ALTER TABLE "Room" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
