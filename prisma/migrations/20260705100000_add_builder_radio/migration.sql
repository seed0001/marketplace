CREATE TABLE "SiteAudioSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "label" TEXT NOT NULL DEFAULT 'Builder Radio',
  "spotifyUrl" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteAudioSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SiteAudioSettings" ADD CONSTRAINT "SiteAudioSettings_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
