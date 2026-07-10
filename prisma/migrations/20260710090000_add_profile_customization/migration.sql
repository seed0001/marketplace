ALTER TABLE "User" ADD COLUMN "profileBio" TEXT;
ALTER TABLE "User" ADD COLUMN "profileStatus" TEXT;
ALTER TABLE "User" ADD COLUMN "profileCoverImage" TEXT;
ALTER TABLE "User" ADD COLUMN "profileBackgroundImage" TEXT;
ALTER TABLE "User" ADD COLUMN "profileAccentColor" TEXT NOT NULL DEFAULT '#34d399';
ALTER TABLE "User" ADD COLUMN "profileTheme" TEXT NOT NULL DEFAULT 'midnight';

CREATE TABLE "ProfileSong" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT,
  "url" TEXT NOT NULL,
  "embedUrl" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProfileSong_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileSong_userId_sortOrder_key" ON "ProfileSong"("userId", "sortOrder");
CREATE INDEX "ProfileSong_userId_idx" ON "ProfileSong"("userId");

ALTER TABLE "ProfileSong" ADD CONSTRAINT "ProfileSong_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
