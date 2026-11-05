-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Perfil" (
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
    "updatedAt" DATETIME NOT NULL,
    "evento" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Perfil" ("alias", "anon", "color", "contact", "createdAt", "id", "idea", "likes", "needs", "power", "que", "updatedAt") SELECT "alias", "anon", "color", "contact", "createdAt", "id", "idea", "likes", "needs", "power", "que", "updatedAt" FROM "Perfil";
DROP TABLE "Perfil";
ALTER TABLE "new_Perfil" RENAME TO "Perfil";
CREATE INDEX "Perfil_createdAt_idx" ON "Perfil"("createdAt");
CREATE INDEX "Perfil_evento_idx" ON "Perfil"("evento");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
