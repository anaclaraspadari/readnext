-- CreateEnum
CREATE TYPE "StatusLeitura" AS ENUM ('quero_ler', 'lendo', 'lido', 'abandonado');

-- CreateTable
CREATE TABLE "livros" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "google_book_id" TEXT,
    "titulo" TEXT NOT NULL,
    "autores" TEXT[],
    "capa_url" TEXT,
    "status" "StatusLeitura" NOT NULL DEFAULT 'quero_ler',
    "data_adicionado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_finalizacao" TIMESTAMP(3),

    CONSTRAINT "livros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livros_google_book_id_key" ON "livros"("google_book_id");
