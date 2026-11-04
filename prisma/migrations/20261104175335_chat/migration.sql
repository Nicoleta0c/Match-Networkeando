-- CreateTable
CREATE TABLE "Mensaje" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "de" TEXT NOT NULL,
    "para" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creado" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Bloqueo" (
    "de" TEXT NOT NULL,
    "para" TEXT NOT NULL,

    PRIMARY KEY ("de", "para")
);

-- CreateIndex
CREATE INDEX "Mensaje_de_idx" ON "Mensaje"("de");

-- CreateIndex
CREATE INDEX "Mensaje_para_idx" ON "Mensaje"("para");

-- CreateIndex
CREATE INDEX "Mensaje_creado_idx" ON "Mensaje"("creado");
