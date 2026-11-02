-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idea" TEXT NOT NULL DEFAULT '',
    "needs" TEXT NOT NULL DEFAULT '[]',
    "power" TEXT NOT NULL,
    "anon" BOOLEAN NOT NULL DEFAULT true,
    "alias" TEXT NOT NULL DEFAULT '',
    "que" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "likes" TEXT NOT NULL DEFAULT '[]',
    "color" TEXT NOT NULL DEFAULT '',
    "createdAt" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Perfil_createdAt_idx" ON "Perfil"("createdAt");
